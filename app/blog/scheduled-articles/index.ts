import aiVsPhotoshop from "./ai-background-remover-vs-photoshop.json";
import amazonWhiteBackground from "./amazon-white-background-photo.json";
import batchBackgrounds from "./batch-remove-product-photo-backgrounds.json";
import budgetPhotography from "./budget-product-photography-tools.json";
import dropshippingPhotoStyle from "./build-a-dropshipping-photo-style.json";
import etsyProductPhotos from "./etsy-product-photos-that-sell.json";
import supplierPhotosLegally from "./prepare-supplier-photos-legally.json";
import editingChecklist from "./product-photo-editing-checklist.json";
import removeProductBackgrounds from "./remove-background-product-photos.json";
import shopifyMistakes from "./shopify-product-photo-mistakes.json";
import type { ScheduledArticle } from "../article-types";

export const SCHEDULED_ARTICLES = [
  removeProductBackgrounds,
  amazonWhiteBackground,
  supplierPhotosLegally,
  shopifyMistakes,
  aiVsPhotoshop,
  batchBackgrounds,
  etsyProductPhotos,
  dropshippingPhotoStyle,
  budgetPhotography,
  editingChecklist,
] as ScheduledArticle[];

function validateSchedule(articles: ScheduledArticle[]): void {
  const ids = new Set<string>();
  let previousTime = 0;
  for (const article of articles) {
    const publishTime = Date.parse(article.publishedAt);
    if (!article.id || ids.has(article.id)) {
      throw new Error(`Scheduled article id is missing or duplicated: ${article.id}`);
    }
    if (!Number.isFinite(publishTime) || publishTime <= previousTime) {
      throw new Error(`Scheduled article publish time is invalid or out of order: ${article.id}`);
    }
    if (!article.title || !article.description || article.blocks.length === 0) {
      throw new Error(`Scheduled article content is incomplete: ${article.id}`);
    }
    ids.add(article.id);
    previousTime = publishTime;
  }
}

validateSchedule(SCHEDULED_ARTICLES);

export const SCHEDULED_ARTICLE_BY_ID = new Map(
  SCHEDULED_ARTICLES.map((article) => [article.id, article]),
);
