import type { Category, Product } from "@/lib/types";

export type CatalogGroupDefinition = {
  id: string;
  title: string;
  shortTitle: string;
  summary: string;
  categorySlugs: string[];
};

export type CatalogGroup = CatalogGroupDefinition & {
  categories: Category[];
  products: Product[];
  productCount: number;
  imagePaths: string[];
};

export const catalogGroupDefinitions: CatalogGroupDefinition[] = [
  {
    id: "power-control",
    title: "Power & Control",
    shortTitle: "Power",
    summary: "Panels, accessories, sockets, contactors, instruments, and control components for electrical rooms.",
    categorySlugs: [
      "distribution-panels",
      "electrical-accessories",
      "industrial-sockets-contactors",
      "terminal-blocks-instruments"
    ]
  },
  {
    id: "cable-infrastructure",
    title: "Cable & Infrastructure",
    shortTitle: "Cable",
    summary: "Cable trays, routing parts, smart telecom panels, and ONT/ONU enclosure products.",
    categorySlugs: ["cable-trays", "smart-panels-ont-onu"]
  },
  {
    id: "safety-facility",
    title: "Safety & Facility",
    shortTitle: "Safety",
    summary: "Fire cabinets, safety products, lockers, and Brady identification for site readiness.",
    categorySlugs: ["fire-fighting-cabinets", "safety-products", "locker-cabinets", "brady-labels-marking"]
  },
  {
    id: "solar-lighting",
    title: "Solar & Lighting",
    shortTitle: "Solar",
    summary: "Solar street lighting, flood lights, and outdoor lighting products for projects.",
    categorySlugs: ["solar-lighting"]
  }
];

export function buildCatalogGroups(categories: Category[], products: Product[] = []): CatalogGroup[] {
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
  const productsByCategory = new Map<string, Product[]>();

  for (const product of products) {
    const current = productsByCategory.get(product.categorySlug) ?? [];
    current.push(product);
    productsByCategory.set(product.categorySlug, current);
  }

  return catalogGroupDefinitions
    .map((definition) => {
      const groupCategories = definition.categorySlugs
        .map((slug) => categoriesBySlug.get(slug))
        .filter((category): category is Category => Boolean(category));
      const groupProducts = groupCategories.flatMap((category) => productsByCategory.get(category.slug) ?? []);
      const fallbackImages = groupCategories
        .map((category) => category.imagePath)
        .filter((imagePath): imagePath is string => Boolean(imagePath));
      const productImages = groupProducts
        .map((product) => product.imagePath)
        .filter(Boolean);

      const imagePaths = Array.from(new Set([...productImages, ...fallbackImages])).slice(0, 4);

      return {
        ...definition,
        categories: groupCategories,
        products: groupProducts,
        productCount: groupCategories.reduce((total, category) => total + (category.productCount ?? 0), 0),
        imagePaths
      };
    })
    .filter((group) => group.categories.length > 0);
}

export function findCatalogGroupForCategory(categorySlug: string, groups: CatalogGroup[]): CatalogGroup | undefined {
  return groups.find((group) => group.categorySlugs.includes(categorySlug));
}

export function getSiblingCategories(categorySlug: string, groups: CatalogGroup[]): Category[] {
  const group = findCatalogGroupForCategory(categorySlug, groups);
  return group?.categories.filter((category) => category.slug !== categorySlug) ?? [];
}
