"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { SelectInput, TextInput } from "@/components/admin/ui/FormField";
import { useToast } from "@/components/admin/ui/Toast";
import { ProductForm } from "@/components/admin/ProductForm";
import { revalidateCatalog } from "@/lib/admin/revalidate";
import {
  deleteProduct,
  listAdminBrands,
  listAdminCategories,
  listAdminProducts,
  listExistingImages,
  setProductsPublished,
  type AdminBrand,
  type AdminCategory,
  type AdminProductListItem
} from "@/lib/admin/products";

type LoadState = "loading" | "ready" | "error";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

async function sessionToken(): Promise<string | undefined> {
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  return data.session?.access_token;
}

export function ProductsManager() {
  const { notify } = useToast();
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ file_path: string; alt_text: string }>>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProductListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const rows = await listAdminProducts();
      setProducts(rows);
      setLoadState("ready");
    } catch {
      setLoadState("error");
      notify("We could not load products. Please try again.", "error");
    }
  }, [notify]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoadState("error");
      return;
    }
    let active = true;
    (async () => {
      try {
        const [productRows, categoryRows, brandRows, imageRows] = await Promise.all([
          listAdminProducts(),
          listAdminCategories(),
          listAdminBrands(),
          listExistingImages()
        ]);
        if (!active) return;
        setProducts(productRows);
        setCategories(categoryRows);
        setBrands(brandRows);
        setExistingImages(imageRows);
        setLoadState("ready");
      } catch {
        if (active) setLoadState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category?.slug !== categoryFilter) return false;
      if (publishedFilter === "published" && !product.is_published) return false;
      if (publishedFilter === "draft" && product.is_published) return false;
      if (term && !product.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, search, categoryFilter, publishedFilter]);

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      const token = await sessionToken();
      if (token) {
        await revalidateCatalog(token, {
          categorySlug: deleteTarget.category?.slug,
          productSlug: deleteTarget.slug
        });
      }
      notify("Product deleted.", "success");
      setDeleteTarget(null);
      setSelectedIds((current) => current.filter((id) => id !== deleteTarget.id));
      await loadProducts();
    } catch {
      notify("We could not delete this product. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function bulkPublish(isPublished: boolean) {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      await setProductsPublished(selectedIds, isPublished);
      const token = await sessionToken();
      if (token) await revalidateCatalog(token);
      notify(
        `${selectedIds.length} product${selectedIds.length > 1 ? "s" : ""} ${isPublished ? "published" : "unpublished"}.`,
        "success"
      );
      setSelectedIds([]);
      await loadProducts();
    } catch {
      notify("We could not update those products. Please try again.", "error");
    } finally {
      setBulkBusy(false);
    }
  }

  const columns: Column<AdminProductListItem>[] = [
    {
      key: "product",
      header: "Product",
      primary: true,
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border bg-white">
            {row.primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.primaryImage} alt="" className="h-full w-full object-contain" />
            ) : (
              <div className="grid h-full w-full place-items-center text-steel">
                <Boxes size={16} aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate font-semibold text-primary">{row.name}</p>
            <p className="truncate text-xs text-steel">{row.slug}</p>
          </div>
        </div>
      )
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      sortValue: (row) => row.category?.name?.toLowerCase() ?? "",
      render: (row) => <span className="text-sm text-steel">{row.category?.name ?? "Uncategorised"}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={row.is_published ? "success" : "muted"}>{row.is_published ? "Published" : "Draft"}</Badge>
          {row.is_featured ? <Badge tone="accent">Featured</Badge> : null}
        </div>
      )
    },
    {
      key: "updated",
      header: "Updated",
      align: "end",
      sortable: true,
      sortValue: (row) => (row.updated_at ? new Date(row.updated_at).getTime() : 0),
      render: (row) => <span className="text-sm text-steel">{formatDate(row.updated_at)}</span>
    }
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-steel">
          Add, edit, and publish catalog products. Changes appear on the public website automatically.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={loadProducts} loading={loadState === "loading"}>
            {loadState === "loading" ? null : <RefreshCw size={15} aria-hidden="true" />}
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" />
            Add product
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <TextInput
          value={search}
          placeholder="Search products"
          onChange={(event) => setSearch(event.target.value)}
        />
        <SelectInput value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          value={publishedFilter}
          onChange={(event) => setPublishedFilter(event.target.value as typeof publishedFilter)}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </SelectInput>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(row) => row.id}
          loading={loadState === "loading"}
          onRowClick={(row) => openEdit(row.id)}
          selection={{ selectedIds, onChange: setSelectedIds }}
          bulkActions={() => (
            <>
              <Button variant="secondary" size="sm" onClick={() => bulkPublish(true)} loading={bulkBusy}>
                Publish
              </Button>
              <Button variant="secondary" size="sm" onClick={() => bulkPublish(false)} loading={bulkBusy}>
                Unpublish
              </Button>
            </>
          )}
          rowActions={(row) => (
            <>
              <button
                type="button"
                onClick={() => openEdit(row.id)}
                className="rounded-md p-1.5 text-steel transition hover:bg-muted hover:text-primary"
                aria-label={`Edit ${row.name}`}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(row)}
                className="rounded-md p-1.5 text-steel transition hover:bg-danger/10 hover:text-danger"
                aria-label={`Delete ${row.name}`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </>
          )}
          empty={
            products.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="No products yet"
                description="Add your first catalog product to publish it on the website."
                action={
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    <Plus size={16} aria-hidden="true" />
                    Add product
                  </Button>
                }
              />
            ) : (
              <EmptyState title="No products match" description="Try a different search or filter." />
            )
          }
        />
      </div>

      <ProductForm
        open={formOpen}
        productId={editingId}
        categories={categories}
        brands={brands}
        existingImages={existingImages}
        onClose={() => setFormOpen(false)}
        onSaved={loadProducts}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this product?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" and its images will be removed from the website. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete product"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
