"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Tag, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { useToast } from "@/components/admin/ui/Toast";
import { BrandForm } from "@/components/admin/BrandForm";
import { revalidateCatalog } from "@/lib/admin/revalidate";
import { deleteBrand, listAdminBrandRows, type AdminBrandRow } from "@/lib/admin/brands";
import { listExistingImages } from "@/lib/admin/products";

type LoadState = "loading" | "ready" | "error";

export function BrandsManager() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminBrandRow[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ file_path: string; alt_text: string }>>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBrandRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBrandRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listAdminBrandRows();
      setRows(data);
      setLoadState("ready");
    } catch {
      setLoadState("error");
      notify("We could not load brands. Please try again.", "error");
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
        const [brandRows, imageRows] = await Promise.all([listAdminBrandRows(), listExistingImages()]);
        if (!active) return;
        setRows(brandRows);
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
      await deleteBrand(deleteTarget.id);
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      if (data.session?.access_token) await revalidateCatalog(data.session.access_token);
      notify("Brand deleted.", "success");
      setDeleteTarget(null);
      await load();
    } catch {
      notify("We could not delete this brand. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<AdminBrandRow>[] = [
    {
      key: "name",
      header: "Brand",
      primary: true,
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-white text-steel">
            {row.logo_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.logo_path} alt="" className="h-full w-full object-contain" />
            ) : (
              <Tag size={16} aria-hidden="true" />
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
      key: "country",
      header: "Country",
      sortable: true,
      sortValue: (row) => (row.country ?? "").toLowerCase(),
      render: (row) => <span className="text-sm text-steel">{row.country ?? "—"}</span>
    },
    {
      key: "status",
      header: "Status",
      align: "end",
      render: (row) => <Badge tone={row.is_published ? "success" : "muted"}>{row.is_published ? "Visible" : "Hidden"}</Badge>
    }
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-steel">Manufacturers and suppliers you can assign to products.</p>
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
            Add brand
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
              icon={Tag}
              title="No brands yet"
              description="Add a brand to assign manufacturers to your products."
            />
          }
        />
      </div>

      <BrandForm
        open={formOpen}
        brand={editing}
        existingImages={existingImages}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this brand?"
        description={deleteTarget ? `"${deleteTarget.name}" will be removed from products that use it.` : undefined}
        confirmLabel="Delete brand"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
