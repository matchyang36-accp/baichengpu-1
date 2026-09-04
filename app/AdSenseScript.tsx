import Script from "next/script";
import { ADSENSE_CLIENT_ID } from "./adsense-config";

export function AdSenseScript() {
  return (
    <Script
      id="adsense-script"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  );
}
