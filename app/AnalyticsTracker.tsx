"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type AnalyticsEventType =
  | "page_view"
  | "cutout_started"
  | "cutout_completed"
  | "cutout_failed"
  | "download"
  | "batch_started"
  | "batch_completed";

function privacyOptedOut(): boolean {
  const navigatorWithPrivacy = navigator as Navigator & {
    globalPrivacyControl?: boolean;
  };
  return navigator.doNotTrack === "1" || navigatorWithPrivacy.globalPrivacyControl === true;
}

export function trackAnalyticsEvent(eventType: AnalyticsEventType, path = location.pathname) {
  if (privacyOptedOut() || path.startsWith("/admin")) return;
  const body = JSON.stringify({
    eventType,
    path,
    referrer: document.referrer,
  });

  if (
    typeof navigator.sendBeacon === "function" &&
    navigator.sendBeacon(
      "/api/analytics/event",
      new Blob([body], { type: "application/json" }),
    )
  ) {
    return;
  }

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    trackAnalyticsEvent("page_view", pathname);
  }, [pathname]);

  return null;
}
