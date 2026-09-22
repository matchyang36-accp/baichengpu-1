import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccountUser } from "../../account-auth";
import {
  generateSeoLandingMetadata,
  SeoLandingPage,
} from "../../seo-landing-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return { robots: { index: false, follow: false } };
  return generateSeoLandingMetadata("product-background-remover");
}

export default async function ProductBackgroundRemoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  const user = await getAccountUser();

  return (
    <SeoLandingPage
      pageId="product-background-remover"
      viewer={user ? { displayName: user.displayName, email: user.email } : null}
    />
  );
}
