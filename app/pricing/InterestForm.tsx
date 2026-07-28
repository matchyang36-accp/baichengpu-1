"use client";

import { FormEvent, useState } from "react";

const NEED_OPTIONS = [
  "复杂背景抠图",
  "批量处理提速",
  "平台主图模板",
  "图片尺寸统一",
  "品牌背景替换",
  "团队协作",
];

export function InterestForm() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);

  const toggleNeed = (need: string) => {
    setSelectedNeeds((current) =>
      current.includes(need)
        ? current.filter((item) => item !== need)
        : [...current, need],
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setResult("idle");

    const form = new FormData(event.currentTarget);
    const payload = {
      role: form.get("role"),
      monthlyVolume: form.get("monthlyVolume"),
      contactChannel: form.get("contactChannel"),
      contact: form.get("contact"),
      note: form.get("note"),
      needs: selectedNeeds,
      source:
        new URLSearchParams(window.location.search).get("from") ?? "pricing",
      website: form.get("website"),
    };

    try {
      const response = await fetch("/api/pro-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("submit-failed");
      setResult("success");
      event.currentTarget.reset();
      setSelectedNeeds([]);
    } catch {
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="interest-section" id="pro-interest">
      <div className="interest-copy">
        <span className="eyebrow">专业版内测申请</span>
        <h2>用 1 分钟告诉我们，你每天在重复什么。</h2>
        <p>
          我们会优先邀请需求匹配的用户。提交后可继续添加微信，便于沟通真实图片场景。
        </p>
        <div className="interest-promise">
          <strong>只收集必要信息</strong>
          <span>不上传图片，不发送营销短信，不会自动扣费。</span>
        </div>
      </div>

      {result === "success" ? (
        <div className="interest-success" role="status">
          <span aria-hidden="true">✓</span>
          <h3>申请已收到</h3>
          <p>下一步请添加微信并备注“专业版内测”，我们会结合你的场景安排体验。</p>
          <a className="primary-button" href="/contact?from=pro-success">
            查看微信二维码
          </a>
        </div>
      ) : (
        <form className="interest-form" onSubmit={submit}>
          <label>
            你的工作角色
            <select name="role" required defaultValue="">
              <option value="" disabled>
                请选择
              </option>
              <option value="ecommerce">电商运营 / 店主</option>
              <option value="new-media">新媒体编辑</option>
              <option value="photography">摄影 / 设计</option>
              <option value="team-lead">团队负责人</option>
              <option value="other">其他</option>
            </select>
          </label>

          <label>
            每月大约处理多少张图片
            <select name="monthlyVolume" required defaultValue="">
              <option value="" disabled>
                请选择
              </option>
              <option value="1-20">1–20 张</option>
              <option value="21-100">21–100 张</option>
              <option value="101-500">101–500 张</option>
              <option value="500+">500 张以上</option>
            </select>
          </label>

          <fieldset>
            <legend>最希望解决的问题（可多选）</legend>
            <div className="need-options">
              {NEED_OPTIONS.map((need) => (
                <button
                  type="button"
                  key={need}
                  className={selectedNeeds.includes(need) ? "is-active" : ""}
                  aria-pressed={selectedNeeds.includes(need)}
                  onClick={() => toggleNeed(need)}
                >
                  {need}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="contact-fields">
            <label>
              联系方式
              <select name="contactChannel" required defaultValue="wechat">
                <option value="wechat">微信号</option>
                <option value="email">电子邮箱</option>
              </select>
            </label>
            <label>
              微信号或邮箱
              <input
                name="contact"
                required
                minLength={3}
                maxLength={120}
                placeholder="用于内测邀请"
                autoComplete="email"
              />
            </label>
          </div>

          <label>
            其他需求（选填）
            <textarea
              name="note"
              maxLength={500}
              rows={3}
              placeholder="例如：主要处理服装图，希望保留自然阴影"
            />
          </label>

          <label className="interest-consent">
            <input type="checkbox" required />
            <span>
              我已阅读并同意<a href="/privacy">隐私说明</a>
            </span>
          </label>

          <label className="interest-honeypot" aria-hidden="true">
            网站
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "正在提交…" : "提交内测申请"}
          </button>

          {result === "error" && (
            <p className="interest-error" role="alert">
              暂时没有提交成功，请稍后重试，或直接通过联系页添加微信。
            </p>
          )}
        </form>
      )}
    </section>
  );
}
