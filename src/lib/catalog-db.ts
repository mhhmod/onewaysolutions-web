import { cache } from "react";
import {
  getCategories as manifestCategories,
  getProducts as manifestProducts,
  getCatalogPages as manifestCatalogPages
} from "@/lib/catalog";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Category, Product } from "@/lib/types";

/**
 * Catalog read layer. The database is the source of truth; the bundled
 * manifest is used as a fallback when the catalog has not been connected or
 * seeded yet, so public pages render identically during the cutover.
 */

type LoadedCatalog = {
  categories: Category[];
  products: Product[];
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  sort_order: number | null;
};

type ProductRelation = {
  name: string | null;
  slug: string | null;
};

type ProductImageRow = {
  file_path: string;
  is_primary: boolean | null;
  sort_order: number | null;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  sort_order: number | null;
  category: ProductRelation | ProductRelation[] | null;
  images: ProductImageRow[] | null;
};

const FEATURED_PRIORITY = new Set([
  "distribution-panels",
  "solar-lighting",
  "smart-panels-ont-onu",
  "fire-fighting-cabinets",
  "cable-trays"
]);

function firstRelation(value: ProductRow["category"]): ProductRelation | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] ?? null : value;
}

function primaryImagePath(images: ProductImageRow[] | null): string {
  if (!images || images.length === 0) {
    return "";
  }
  const ordered = [...images].sort(
    (a, b) =>
      Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) ||
      (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  return ordered[0]?.file_path ?? "";
}

const loadFromDatabase = cache(async (): Promise<LoadedCatalog | null> => {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const [categoryResult, productResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,slug,description,image_path,sort_order")
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select(
        "id,name,slug,summary,sort_order,category:categories(name,slug),images:product_images(file_path,is_primary,sort_order)"
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
  ]);

  if (categoryResult.error || productResult.error) {
    return null;
  }

  const categoryRows = (categoryResult.data ?? []) as CategoryRow[];
  if (categoryRows.length === 0) {
    return null;
  }

  const productRows = (productResult.data ?? []) as ProductRow[];

  const products: Product[] = productRows
    .map((row) => {
      const category = firstRelation(row.category);
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        summary: row.summary,
        categorySlug: category?.slug ?? "",
        categoryName: category?.name ?? "",
        imagePath: primaryImagePath(row.images),
        sortOrder: row.sort_order ?? 0
      } satisfies Product;
    })
    // The current public UI requires an image to render a product card.
    .filter((product) => product.imagePath.length > 0);

  const productCounts = new Map<string, number>();
  for (const product of products) {
    productCounts.set(product.categorySlug, (productCounts.get(product.categorySlug) ?? 0) + 1);
  }

  const categories: Category[] = categoryRows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imagePath: row.image_path,
    productCount: productCounts.get(row.slug) ?? 0,
    sortOrder: row.sort_order ?? 0
  }));

  return { categories, products };
});

const loadCatalog = cache(async (): Promise<LoadedCatalog> => {
  const fromDatabase = await loadFromDatabase();
  if (fromDatabase) {
    return fromDatabase;
  }
  return {
    categories: manifestCategories(),
    products: manifestProducts()
  };
});

export async function getCategories(): Promise<Category[]> {
  return (await loadCatalog()).categories;
}

export async function getProducts(): Promise<Product[]> {
  return (await loadCatalog()).products;
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  return (await loadCatalog()).categories.find((category) => category.slug === slug);
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  return (await loadCatalog()).products.filter((product) => product.categorySlug === slug);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await loadCatalog()).products.find((product) => product.slug === slug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const { products } = await loadCatalog();
  return products
    .filter((candidate) => candidate.categorySlug === product.categorySlug && candidate.slug !== product.slug)
    .slice(0, limit);
}

export async function getFeaturedProducts(limit = 12): Promise<Product[]> {
  const { products } = await loadCatalog();
  const prioritized = products.filter((product) => FEATURED_PRIORITY.has(product.categorySlug));
  return (prioritized.length > 0 ? prioritized : products).slice(0, limit);
}

export async function getCatalogTotals() {
  const { categories, products } = await loadCatalog();
  return {
    categories: categories.length,
    products: products.length,
    catalogPages: manifestCatalogPages().length
  };
}
