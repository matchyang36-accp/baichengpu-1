import { BackgroundRemover } from "./BackgroundRemover";
import { getAccountUser } from "./account-auth";
import { getLocaleFromHeaders } from "../i18n/translator";
import { FaqSchema, SoftwareAppSchema } from "./lib/structured-data";
import { getHomeSeoContent } from "./home-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, locale] = await Promise.all([getAccountUser(), getLocaleFromHeaders()]);

  return (
    <>
      <SoftwareAppSchema locale={locale} />
      <FaqSchema locale={locale} items={getHomeSeoContent(locale).faq.items} />
      <BackgroundRemover
        viewer={
          user
            ? { displayName: user.displayName, email: user.email }
            : null
        }
      />
    </>
  );
}
