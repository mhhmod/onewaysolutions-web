import { AdminDashboard } from "@/components/AdminDashboard";
import { getCatalogTotals, getCategories } from "@/lib/catalog";

export const metadata = {
  title: "Admin"
};

export default function AdminPage() {
  return <AdminDashboard totals={getCatalogTotals()} categories={getCategories()} />;
}
