import type { Language } from "@/translations/landing";
import type { Category, Product } from "@/types/api";

/** Localized catalog product title; falls back to Thai/default `name`. */
export function getProductName(
  product: Pick<Product, "name" | "name_en">,
  lang: Language,
): string {
  if (lang === "en" && product.name_en?.trim()) {
    return product.name_en.trim();
  }
  return product.name;
}

/** Localized catalog category label; falls back to Thai/default `name`. */
export function getCategoryName(
  category: Pick<Category, "name" | "name_en">,
  lang: Language,
): string {
  if (lang === "en" && category.name_en?.trim()) {
    return category.name_en.trim();
  }
  return category.name;
}
