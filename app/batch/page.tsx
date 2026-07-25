import type { Metadata } from "next";
import { BatchRemover } from "./BatchRemover";

export const metadata: Metadata = {
  title: "批量抠图｜白橙铺",
  description: "多张商品图片在浏览器本地自动排队抠图，打包下载透明 PNG。",
};

export default function BatchPage() {
  return <BatchRemover />;
}
