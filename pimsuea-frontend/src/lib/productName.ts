import type { Language } from "@/translations/landing";
import type { Product } from "@/types/api";

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
