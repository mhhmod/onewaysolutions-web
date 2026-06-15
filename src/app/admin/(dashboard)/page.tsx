import { AdminOverview } from "@/components/admin/AdminOverview";
import { getCatalogTotals, getCategories } from "@/lib/catalog-db";

export const metadata = {
  title: "Overview"
};

export default async function AdminOverviewPage() {
  const [totals, categories] = await Promise.all([getCatalogTotals(), getCategories()]);

  const topCategories = [...categories]
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 6)
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      productCount: category.productCount ?? 0
    }));

  return (
    <AdminOverview
      totals={{ products: totals.products, categories: totals.categories }}
      topCategories={topCategories}
    />
  );
}
