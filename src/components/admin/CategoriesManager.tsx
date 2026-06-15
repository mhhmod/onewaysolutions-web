"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { useToast } from "@/components/admin/ui/Toast";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { revalidateCatalog } from "@/lib/admin/revalidate";
import { deleteCategory, listAdminCategoryRows, type AdminCategoryRow } from "@/lib/admin/categories";
import { listExistingImages } from "@/lib/admin/products";

type LoadState = "loading" | "ready" | "error";

export function CategoriesManager() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminCategoryRow[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ file_path: string; alt_text: string }>>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listAdminCategoryRows();
      setRows(data);
      setLoadState("ready");
    } catch {
      setLoadState("error");
      notify("We could not load categories. Please try again.", "error");
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
        const [categoryRows, imageRows] = await Promise.all([listAdminCategoryRows(), listExistingImages()]);
        if (!active) return;
        setRows(categoryRows);
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      if (data.session?.access_token) {
        await revalidateCatalog(data.session.access_token, { categorySlug: deleteTarget.slug });
      }
      notify("Category deleted.", "success");
      setDeleteTarget(null);
      await load();
    } catch {
      notify("We could not delete this category. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<AdminCategoryRow>[] = [
    {
      key: "name",
      header: "Category",
      primary: true,
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-white text-steel">
            {row.image_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.image_path} alt="" className="h-full w-full object-contain" />
            ) : (
              <Layers size={16} aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-primary">{row.name}</p>
            <p className="truncate text-xs text-steel">{row.slug}</p>
          </div>
        </div>
      )
    },
    {
      key: "products",
      header: "Products",
      align: "end",
      sortable: true,
      sortValue: (row) => row.productCount,
      render: (row) => <span className="tabular-nums text-sm text-primary">{row.productCount}</span>
    },
    {
      key: "order",
      header: "Order",
      align: "end",
      sortable: true,
      sortValue: (row) => row.sort_order,
      render: (row) => <span className="tabular-nums text-sm text-steel">{row.sort_order}</span>
    },
    {
      key: "status",
      header: "Status",
      align: "end",
      render: (row) => <Badge tone={row.is_published ? "success" : "muted"}>{row.is_published ? "Published" : "Hidden"}</Badge>
    }
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-steel">Organise the catalog into sections shown on the public website.</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={load} loading={loadState === "loading"}>
            {loadState === "loading" ? null : <RefreshCw size={15} aria-hidden="true" />}
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Add category
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={loadState === "loading"}
          onRowClick={(row) => {
            setEditing(row);
            setFormOpen(true);
          }}
          rowActions={(row) => (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditing(row);
                  setFormOpen(true);
                }}
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
            <EmptyState
              icon={Layers}
              title="No categories yet"
              description="Add a category to group your catalog products."
            />
          }
        />
      </div>

      <CategoryForm
        open={formOpen}
        category={editing}
        allCategories={rows}
        existingImages={existingImages}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this category?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed. Its ${deleteTarget.productCount} product(s) stay in the catalog but become uncategorised.`
            : undefined
        }
        confirmLabel="Delete category"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
