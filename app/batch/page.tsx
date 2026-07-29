import type { Metadata } from "next";
import { BatchRemover } from "./BatchRemover";
import { getAccountUser } from "../account-auth";

export const metadata: Metadata = {
  title: "批量抠图｜白橙铺",
  description: "多张商品图片在浏览器本地自动排队抠图，打包下载透明 PNG。",
};

export const dynamic = "force-dynamic";

export default async function BatchPage() {
  const user = await getAccountUser();

  return (
    <BatchRemover
      viewer={
        user
          ? { displayName: user.displayName, email: user.email }
          : null
      }
    />
  );
}
