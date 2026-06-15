"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Mail, MapPin, Phone, RefreshCw, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { Badge, type BadgeTone } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { Drawer } from "@/components/admin/ui/Drawer";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Field, SelectInput, TextArea, TextInput } from "@/components/admin/ui/FormField";
import { useToast } from "@/components/admin/ui/Toast";
import { cn } from "@/lib/cn";

type QuoteStatus = "new" | "reviewing" | "quoted" | "closed" | "archived";
type LoadState = "loading" | "ready" | "error";
type DateRange = "all" | "7" | "30";

type QuoteItemPreview = { name?: string; categoryName?: string; quantity?: number; notes?: string };

type QuoteRequest = {
  id: string;
  status: QuoteStatus;
  customer_name: string;
  company_name: string;
  email: string | null;
  phone: string;
  project_location: string | null;
  message: string | null;
  items: QuoteItemPreview[];
  created_at: string;
};

const statuses: QuoteStatus[] = ["new", "reviewing", "quoted", "closed", "archived"];
const PAGE_SIZE = 15;

const statusTone: Record<QuoteStatus, BadgeTone> = {
  new: "accent",
  reviewing: "primary",
  quoted: "success",
  closed: "neutral",
  archived: "muted"
};

function formatStatus(value: QuoteStatus) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function normalizeStatus(value: unknown): QuoteStatus {
  return statuses.includes(value as QuoteStatus) ? (value as QuoteStatus) : "new";
}

function normalizeItems(value: unknown): QuoteItemPreview[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      name: typeof item.name === "string" ? item.name : undefined,
      categoryName: typeof item.categoryName === "string" ? item.categoryName : undefined,
      quantity: typeof item.quantity === "number" ? item.quantity : undefined,
      notes: typeof item.notes === "string" ? item.notes : undefined
    }));
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function exportCsv(rows: QuoteRequest[]) {
  const header = ["Submitted", "Customer", "Company", "Email", "Phone", "Location", "Status", "Items", "Message"];
  const lines = rows.map((row) =>
    [
      formatDate(row.created_at),
      row.customer_name,
      row.company_name,
      row.email ?? "",
      row.phone,
      row.project_location ?? "",
      formatStatus(row.status),
      row.items.length,
      row.message ?? ""
    ]
      .map(csvCell)
      .join(",")
  );
  const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quote-requests.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function QuotesView() {
  const { notify } = useToast();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<QuoteStatus>("reviewing");
  const [bulkBusy, setBulkBusy] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [notesAvailable, setNotesAvailable] = useState<boolean | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const notesUnavailableRef = useRef(false);

  const load = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setLoadState("error");
      return;
    }
    setLoadState("loading");
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("quote_requests")
      .select("id,status,customer_name,company_name,email,phone,project_location,message,items,created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setLoadState("error");
      notify("We could not load quote requests. Please try again.", "error");
      return;
    }

    setRequests(
      (data ?? []).map((row) => ({
        ...(row as QuoteRequest),
        status: normalizeStatus((row as QuoteRequest).status),
        items: normalizeItems((row as { items: unknown }).items)
      }))
    );
    setLoadState("ready");
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [statusFilter, search, dateRange]);

  // Load internal notes when a request is opened (auto-detects the column once).
  useEffect(() => {
    if (!selectedId || notesUnavailableRef.current || !hasSupabaseConfig) {
      return;
    }
    let active = true;
    setNotesValue("");
    setNotesLoading(true);
    getSupabaseBrowserClient()
      .from("quote_requests")
      .select("admin_notes")
      .eq("id", selectedId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          notesUnavailableRef.current = true;
          setNotesAvailable(false);
        } else {
          setNotesAvailable(true);
          setNotesValue((data as { admin_notes: string | null } | null)?.admin_notes ?? "");
        }
        setNotesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  async function updateStatus(ids: string[], status: QuoteStatus) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("quote_requests").update({ status }).in("id", ids);
    if (error) {
      notify("Could not update the status. Please try again.", "error");
      return false;
    }
    setRequests((current) => current.map((request) => (ids.includes(request.id) ? { ...request, status } : request)));
    return true;
  }

  async function handleDrawerStatus(id: string, status: QuoteStatus) {
    setUpdating(true);
    const ok = await updateStatus([id], status);
    setUpdating(false);
    if (ok) notify(`Marked as ${formatStatus(status).toLowerCase()}.`, "success");
  }

  async function handleBulkStatus() {
    if (actionableIds.length === 0) return;
    setBulkBusy(true);
    const ok = await updateStatus(actionableIds, bulkStatus);
    setBulkBusy(false);
    if (ok) {
      notify(`${actionableIds.length} request(s) marked as ${formatStatus(bulkStatus).toLowerCase()}.`, "success");
      setSelectedIds([]);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("quote_requests").delete().in("id", pendingDelete.ids);
    setDeleting(false);
    if (error) {
      notify("We could not delete those requests. Please try again.", "error");
      return;
    }
    const removed = new Set(pendingDelete.ids);
    setRequests((current) => current.filter((request) => !removed.has(request.id)));
    setSelectedIds((current) => current.filter((id) => !removed.has(id)));
    if (selectedId && removed.has(selectedId)) setSelectedId(null);
    setPendingDelete(null);
    notify("Quote request(s) deleted.", "success");
  }

  async function saveNotes(id: string) {
    setNotesSaving(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("quote_requests").update({ admin_notes: notesValue }).eq("id", id);
    setNotesSaving(false);
    if (error) {
      notesUnavailableRef.current = true;
      setNotesAvailable(false);
      notify("Internal notes are not available yet.", "error");
      return;
    }
    notify("Notes saved.", "success");
  }

  const counts = useMemo(() => {
    const map = new Map<QuoteStatus, number>();
    for (const request of requests) map.set(request.status, (map.get(request.status) ?? 0) + 1);
    return map;
  }, [requests]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cutoff = dateRange === "all" ? 0 : Date.now() - Number(dateRange) * 86_400_000;
    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (cutoff && new Date(request.created_at).getTime() < cutoff) return false;
      if (term) {
        const haystack = `${request.customer_name} ${request.company_name} ${request.email ?? ""} ${request.phone}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [requests, statusFilter, search, dateRange]);

  // Only act on selected rows that are still within the current filtered view.
  const actionableIds = useMemo(
    () => selectedIds.filter((id) => filtered.some((request) => request.id === id)),
    [selectedIds, filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selected = useMemo(() => requests.find((request) => request.id === selectedId) ?? null, [requests, selectedId]);

  const columns: Column<QuoteRequest>[] = [
    {
      key: "customer",
      header: "Customer",
      primary: true,
      sortable: true,
      sortValue: (row) => row.customer_name.toLowerCase(),
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-primary">{row.customer_name}</p>
          <p className="truncate text-xs text-steel">{row.company_name}</p>
        </div>
      )
    },
    {
      key: "submitted",
      header: "Submitted",
      sortable: true,
      sortValue: (row) => new Date(row.created_at).getTime(),
      render: (row) => <span className="text-sm text-steel">{formatDate(row.created_at)}</span>
    },
    {
      key: "items",
      header: "Items",
      align: "end",
      sortable: true,
      sortValue: (row) => row.items.length,
      render: (row) => <span className="tabular-nums text-sm text-primary">{row.items.length}</span>
    },
    {
      key: "status",
      header: "Status",
      align: "end",
      sortable: true,
      sortValue: (row) => row.status,
      render: (row) => <Badge tone={statusTone[row.status]}>{formatStatus(row.status)}</Badge>
    }
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-steel">
          Search, filter, and move customer requests through their workflow.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <Download size={15} aria-hidden="true" />
            Export
          </Button>
          <Button variant="secondary" size="sm" onClick={load} loading={loadState === "loading"}>
            {loadState === "loading" ? null : <RefreshCw size={15} aria-hidden="true" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <TextInput
          value={search}
          placeholder="Search name, company, email, or phone"
          onChange={(event) => setSearch(event.target.value)}
        />
        <SelectInput value={dateRange} onChange={(event) => setDateRange(event.target.value as DateRange)}>
          <option value="all">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </SelectInput>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip label="All" count={requests.length} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        {statuses.map((status) => (
          <FilterChip
            key={status}
            label={formatStatus(status)}
            count={counts.get(status) ?? 0}
            active={statusFilter === status}
            onClick={() => setStatusFilter(status)}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(row) => row.id}
          loading={loadState === "loading"}
          onRowClick={(row) => setSelectedId(row.id)}
          selection={{ selectedIds, onChange: setSelectedIds }}
          bulkActions={() => (
            <>
              <SelectInput
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value as QuoteStatus)}
                className="min-h-9 w-auto py-0"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </SelectInput>
              <Button variant="secondary" size="sm" onClick={handleBulkStatus} loading={bulkBusy}>
                Apply status
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setPendingDelete({ ids: actionableIds, label: `${actionableIds.length} request(s)` })}
              >
                <Trash2 size={15} aria-hidden="true" />
                Delete
              </Button>
            </>
          )}
          empty={
            requests.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No quote requests yet"
                description="New customer submissions from the public quote page will appear here automatically."
              />
            ) : (
              <EmptyState title="No requests match" description="Try a different search, status, or date range." />
            )
          }
        />
        {filtered.length > PAGE_SIZE ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <p className="text-steel">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.customer_name ?? "Quote request"}
        description={selected?.company_name}
        footer={
          selected ? (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setPendingDelete({ ids: [selected.id], label: "this request" })}
              >
                <Trash2 size={15} aria-hidden="true" />
                Delete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="grid gap-6">
            <Field label="Status">
              <SelectInput
                value={selected.status}
                disabled={updating}
                onChange={(event) => handleDrawerStatus(selected.id, event.target.value as QuoteStatus)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <div className="grid gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-steel">Submitted</p>
              <p className="text-primary">{formatDate(selected.created_at)}</p>
            </div>

            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-steel">Contact</p>
              <a className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-primary" href={`tel:${selected.phone}`}>
                <Phone size={15} aria-hidden="true" />
                {selected.phone}
              </a>
              {selected.email ? (
                <a className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-primary" href={`mailto:${selected.email}`}>
                  <Mail size={15} aria-hidden="true" />
                  {selected.email}
                </a>
              ) : null}
              {selected.project_location ? (
                <p className="inline-flex min-h-9 items-center gap-2 text-sm text-steel">
                  <MapPin size={15} aria-hidden="true" />
                  {selected.project_location}
                </p>
              ) : null}
            </div>

            {selected.message ? (
              <div className="grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-steel">Message</p>
                <p className="rounded-md bg-background p-3 text-sm leading-6 text-steel">{selected.message}</p>
              </div>
            ) : null}

            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent">
                Selected items ({selected.items.length})
              </p>
              <div className="grid gap-2">
                {selected.items.map((item, index) => (
                  <div
                    key={`${selected.id}-${item.name ?? index}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-md border border-border bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary">{item.name ?? "Catalog item"}</p>
                      {item.categoryName ? <p className="truncate text-xs text-steel">{item.categoryName}</p> : null}
                      {item.notes ? <p className="mt-1 text-xs leading-5 text-steel">{item.notes}</p> : null}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-accent">Qty {item.quantity ?? 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {notesAvailable !== false ? (
              <div className="grid gap-2 border-t border-border pt-5">
                <Field label="Internal notes" hint="Private to your team. Customers never see this.">
                  <TextArea
                    rows={3}
                    value={notesValue}
                    disabled={notesLoading || notesSaving}
                    onChange={(event) => setNotesValue(event.target.value)}
                    placeholder="Add a note for your team"
                  />
                </Field>
                <div className="flex justify-end">
                  <Button variant="secondary" size="sm" loading={notesSaving} onClick={() => saveNotes(selected.id)}>
                    Save notes
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete quote request?"
        description={
          pendingDelete
            ? `${pendingDelete.label} will be permanently removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface text-primary hover:border-primary/30 hover:bg-muted"
      )}
    >
      {label}
      <span className={cn("tabular-nums text-xs", active ? "text-white/75" : "text-steel")}>{count}</span>
    </button>
  );
}
