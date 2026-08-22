"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_ARTICLE_SLOT_ID, ADSENSE_CLIENT_ID } from "./adsense-config";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function AdSenseUnit({ label }: { label: string }) {
  const adElementRef = useRef<HTMLModElement | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const adElement = adElementRef.current;
    if (initializedRef.current || !adElement || adElement.dataset.adsbygoogleStatus) return;

    initializedRef.current = true;
    try {
      const queue = window.adsbygoogle ?? [];
      queue.push({});
      window.adsbygoogle = queue;
    } catch (error) {
      initializedRef.current = false;
      console.error("[adsense] UNIT_INIT_FAILED", {
        slot: ADSENSE_ARTICLE_SLOT_ID,
        error,
      });
    }
  }, []);

  return (
    <aside className="article-ad-slot" aria-label={label}>
      <span>{label}</span>
      <ins
        ref={adElementRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_ARTICLE_SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
