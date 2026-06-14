export type Category = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  productCount?: number;
  sortOrder?: number;
};

export type Product = {
  id?: string;
  name: string;
  slug: string;
  summary: string | null;
  categorySlug: string;
  categoryName: string;
  imagePath: string;
  sourcePage?: number | null;
  sourceFolder?: string | null;
  sourceFilename?: string | null;
  imageNumber?: number | null;
  width?: number | null;
  height?: number | null;
  sortOrder?: number;
};

export type CatalogManifest = {
  generatedAt: string;
  categories: Category[];
  products: Product[];
  catalogPages: Array<{
    id: string;
    pageNumber: number;
    title: string;
    imagePath: string;
    width: number;
    height: number;
  }>;
  totals: {
    categories: number;
    products: number;
    catalogPages: number;
  };
};

export type QuoteItem = {
  slug: string;
  name: string;
  categoryName: string;
  imagePath: string;
  quantity: number;
  notes?: string;
};

export type QuoteRequestPayload = {
  customer_name: string;
  company_name: string;
  email: string | null;
  phone: string;
  project_location: string | null;
  message: string | null;
  items: QuoteItem[];
  source: "website";
  status: "new";
};
