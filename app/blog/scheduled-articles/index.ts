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
import seriesTwo11 from "./tiktok-shop-product-photos.json";
import seriesTwo12 from "./ebay-product-photo-tips.json";
import seriesTwo13 from "./jewelry-product-photography.json";
import seriesTwo14 from "./ghost-mannequin-photo-effect.json";
import seriesTwo15 from "./cosmetics-product-photography.json";
import seriesTwo16 from "./electronics-product-photography.json";
import seriesTwo17 from "./furniture-product-photography.json";
import seriesTwo18 from "./black-friday-product-photos.json";
import seriesTwo19 from "./print-on-demand-mockup-editing.json";
import seriesTwo20 from "./instagram-product-photos.json";
import seriesTwo21 from "./pinterest-product-pins.json";
import seriesTwo22 from "./google-shopping-product-images.json";
import seriesTwo23 from "./remove-person-from-photo.json";
import seriesTwo24 from "./amazon-image-suppression-fix.json";
import seriesTwo25 from "./food-product-photography.json";
import seriesTwo26 from "./handmade-product-photography.json";
import seriesTwo27 from "./poshmark-depop-product-photos.json";
import seriesTwo28 from "./add-shadow-product-photo.json";
import seriesTwo29 from "./fitness-product-photography.json";
import seriesTwo30 from "./diy-product-photography-workflow.json";
import seriesTwo31 from "./product-photo-seo-file-names.json";
import seriesTwo32 from "./glass-product-photography.json";
import seriesTwo33 from "./baby-product-photography.json";
import seriesTwo34 from "./pet-product-photography.json";
import seriesTwo35 from "./repurpose-product-photos.json";
import seriesTwo36 from "./product-photo-compression.json";
import seriesTwo37 from "./walmart-marketplace-images.json";
import seriesTwo38 from "./candle-product-photography.json";
import seriesTwo39 from "./sticker-product-photography.json";
import seriesTwo40 from "./vintage-antique-product-photography.json";
import seriesTwo41 from "./reflective-product-photography.json";
import seriesTwo42 from "./amazon-fba-product-photos.json";
import seriesTwo43 from "./small-product-photography.json";
import seriesTwo44 from "./seasonal-product-photography.json";
import seriesTwo45 from "./product-photo-color-correction.json";
import seriesTwo46 from "./product-photo-brand-style-guide.json";
import seriesTwo47 from "./solo-founder-photo-editing-skills.json";
import seriesTwo48 from "./tiktok-ads-product-photos.json";
import seriesTwo49 from "./best-background-color-product-photos.json";
import seriesTwo50 from "./dropship-product-photos-china.json";
import seriesTwo51 from "./product-photo-trends-2026.json";
import seriesTwo52 from "./wholesale-product-photography.json";
import seriesTwo53 from "./phone-product-photography.json";
import seriesTwo54 from "./fix-blurry-product-photo.json";
import seriesTwo55 from "./product-photo-a-b-test.json";
import seriesTwo56 from "./ugly-product-photography.json";
import seriesTwo57 from "./product-photo-refresh-strategy.json";
import seriesTwo58 from "./product-photo-color-variants.json";
import seriesTwo59 from "./amateur-amazon-product-photos.json";
import seriesTwo60 from "./timeless-product-photography.json";
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
  seriesTwo11,
  seriesTwo12,
  seriesTwo13,
  seriesTwo14,
  seriesTwo15,
  seriesTwo16,
  seriesTwo17,
  seriesTwo18,
  seriesTwo19,
  seriesTwo20,
  seriesTwo21,
  seriesTwo22,
  seriesTwo23,
  seriesTwo24,
  seriesTwo25,
  seriesTwo26,
  seriesTwo27,
  seriesTwo28,
  seriesTwo29,
  seriesTwo30,
  seriesTwo31,
  seriesTwo32,
  seriesTwo33,
  seriesTwo34,
  seriesTwo35,
  seriesTwo36,
  seriesTwo37,
  seriesTwo38,
  seriesTwo39,
  seriesTwo40,
  seriesTwo41,
  seriesTwo42,
  seriesTwo43,
  seriesTwo44,
  seriesTwo45,
  seriesTwo46,
  seriesTwo47,
  seriesTwo48,
  seriesTwo49,
  seriesTwo50,
  seriesTwo51,
  seriesTwo52,
  seriesTwo53,
  seriesTwo54,
  seriesTwo55,
  seriesTwo56,
  seriesTwo57,
  seriesTwo58,
  seriesTwo59,
  seriesTwo60,
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
