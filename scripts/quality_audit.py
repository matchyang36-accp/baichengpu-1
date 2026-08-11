from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image


def alpha_metrics(path: Path) -> tuple[tuple[int, int], list[int], dict[str, float]]:
    image = Image.open(path).convert("RGBA")
    alpha = list(image.getchannel("A").get_flattened_data())
    total = max(1, len(alpha))
    transparent = sum(value <= 8 for value in alpha) / total
    opaque = sum(value >= 247 for value in alpha) / total
    soft = sum(8 < value < 247 for value in alpha) / total

    width, height = image.size
    border = []
    border.extend(alpha[:width])
    border.extend(alpha[-width:])
    for y in range(1, max(1, height - 1)):
        border.append(alpha[y * width])
        border.append(alpha[y * width + width - 1])
    border_coverage = sum(value > 32 for value in border) / max(1, len(border))

    return image.size, alpha, {
        "transparent_ratio": round(transparent, 4),
        "opaque_ratio": round(opaque, 4),
        "soft_edge_ratio": round(soft, 4),
        "border_coverage": round(border_coverage, 4),
    }


def mask_iou(result_path: Path, golden_path: Path) -> float | None:
    result = Image.open(result_path).convert("RGBA")
    golden = Image.open(golden_path).convert("RGBA")
    if result.size != golden.size:
        return None
    result_mask = [value > 127 for value in result.getchannel("A").get_flattened_data()]
    golden_mask = [value > 127 for value in golden.getchannel("A").get_flattened_data()]
    intersection = sum(a and b for a, b in zip(result_mask, golden_mask))
    union = sum(a or b for a, b in zip(result_mask, golden_mask))
    return round(intersection / max(1, union), 4)


def audit_case(case: dict[str, Any], source_dir: Path, result_dir: Path) -> dict[str, Any]:
    source_path = source_dir / case["source"]
    result_path = result_dir / case["result"]
    row: dict[str, Any] = {
        "id": case["id"],
        "category": case["category"],
        "source": str(source_path),
        "result": str(result_path),
        "status": "PASS",
        "notes": [],
    }

    if not source_path.exists() or not result_path.exists():
        row["status"] = "MISSING"
        row["notes"].append("source or processed result is missing")
        return row

    source_size = Image.open(source_path).size
    result_size, _, metrics = alpha_metrics(result_path)
    row.update(metrics)
    row["source_size"] = source_size
    row["result_size"] = result_size

    if source_size != result_size:
        row["status"] = "FAIL"
        row["notes"].append("result dimensions changed")
    if metrics["transparent_ratio"] < 0.01:
        row["status"] = "FAIL"
        row["notes"].append("almost no background was removed")
    if metrics["transparent_ratio"] > 0.99:
        row["status"] = "FAIL"
        row["notes"].append("almost the entire image was removed")
    if metrics["border_coverage"] > 0.35:
        if row["status"] == "PASS":
            row["status"] = "REVIEW"
        row["notes"].append("foreground touches much of the image border; check clipping")

    golden_name = case.get("golden")
    if golden_name:
        golden_path = source_dir / golden_name
        if golden_path.exists():
            row["mask_iou"] = mask_iou(result_path, golden_path)
            if row["mask_iou"] is not None and row["mask_iou"] < 0.85:
                if row["status"] == "PASS":
                    row["status"] = "REVIEW"
                row["notes"].append("mask differs materially from the accepted reference")

    if not row["notes"]:
        row["notes"].append("automatic structural checks passed")
    return row


def markdown_report(rows: list[dict[str, Any]]) -> str:
    lines = [
        "# Background-removal quality audit",
        "",
        "| Case | Category | Status | Transparent | Soft edge | Border | Mask IoU |",
        "|---|---|---:|---:|---:|---:|---:|",
    ]
    for row in rows:
        lines.append(
            "| {id} | {category} | {status} | {transparent} | {soft} | {border} | {iou} |".format(
                id=row["id"],
                category=row["category"],
                status=row["status"],
                transparent=row.get("transparent_ratio", "-"),
                soft=row.get("soft_edge_ratio", "-"),
                border=row.get("border_coverage", "-"),
                iou=row.get("mask_iou", "-"),
            )
        )
    lines.extend(["", "## Review notes", ""])
    for row in rows:
        lines.append(f"- **{row['id']}**: {'; '.join(row['notes'])}")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", type=Path, default=Path("tests/quality/cases.json"))
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--result-dir", type=Path, required=True)
    parser.add_argument("--report-dir", type=Path, default=Path("quality-report"))
    args = parser.parse_args()

    cases = json.loads(args.cases.read_text(encoding="utf-8"))
    rows = [audit_case(case, args.source_dir, args.result_dir) for case in cases]
    args.report_dir.mkdir(parents=True, exist_ok=True)
    (args.report_dir / "quality-report.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (args.report_dir / "quality-report.md").write_text(
        markdown_report(rows), encoding="utf-8"
    )
    print(markdown_report(rows))
    return 1 if any(row["status"] == "FAIL" for row in rows) else 0


if __name__ == "__main__":
    raise SystemExit(main())
