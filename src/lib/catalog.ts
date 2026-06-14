import manifest from "@/data/catalog-manifest.json";
import type { CatalogManifest, Category, Product } from "@/lib/types";

const catalog = manifest as CatalogManifest;

export function getCategories(): Category[] {
  return catalog.categories;
}

export function getProducts(): Product[] {
  return catalog.products;
}

export function getCategory(slug: string): Category | undefined {
  return catalog.categories.find((category) => category.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  return catalog.products.filter((product) => product.categorySlug === slug);
}

export function getProduct(slug: string): Product | undefined {
  return catalog.products.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return catalog.products
    .filter((candidate) => candidate.categorySlug === product.categorySlug && candidate.slug !== product.slug)
    .slice(0, limit);
}

export function getFeaturedProducts(limit = 12): Product[] {
  const priority = new Set([
    "distribution-panels",
    "solar-lighting",
    "smart-panels-ont-onu",
    "fire-fighting-cabinets",
    "cable-trays"
  ]);

  return catalog.products
    .filter((product) => priority.has(product.categorySlug))
    .slice(0, limit);
}

export function getCatalogTotals() {
  return catalog.totals;
}

export function getCatalogPages() {
  return catalog.catalogPages;
}
