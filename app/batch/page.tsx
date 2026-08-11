import type { Metadata } from "next";
import { getTranslator } from "../../i18n/core";
import { getLocaleFromHeaders } from "../../i18n/translator";
import { BatchRemover } from "./BatchRemover";
import { getAccountUser } from "../account-auth";
import { localizedAlternates } from "../seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  return {
    title: t("metadata.batch.title"),
    description: t("metadata.batch.description"),
    alternates: localizedAlternates(locale, "/batch"),
  };
}

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
