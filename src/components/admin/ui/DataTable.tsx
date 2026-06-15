"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/admin/ui/Skeleton";

export type Column<T> = {
  key: string;
  header: string;
  align?: "start" | "end";
  className?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
  /** Used as the title in the mobile card fallback. */
  primary?: boolean;
  /** Omit from the mobile card body (still shown on desktop). */
  hideOnCard?: boolean;
};

type Selection = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  selection?: Selection;
  bulkActions?: (selectedIds: string[]) => ReactNode;
};

type SortState = { key: string; direction: "asc" | "desc" } | null;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty,
  onRowClick,
  rowActions,
  selection,
  bulkActions
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);

  const sortedRows = useMemo(() => {
    if (!sort) {
      return rows;
    }
    const column = columns.find((item) => item.key === sort.key);
    if (!column?.sortValue) {
      return rows;
    }
    const sorter = column.sortValue;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = sorter(a);
      const right = sorter(b);
      if (left < right) return -1 * factor;
      if (left > right) return 1 * factor;
      return 0;
    });
  }, [columns, rows, sort]);

  function toggleSort(column: Column<T>) {
    if (!column.sortable || !column.sortValue) {
      return;
    }
    setSort((current) => {
      if (current?.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }
      return current.direction === "asc"
        ? { key: column.key, direction: "desc" }
        : null;
    });
  }

  const selectedSet = useMemo(() => new Set(selection?.selectedIds ?? []), [selection?.selectedIds]);
  const visibleIds = sortedRows.map(rowKey);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

  function toggleAll() {
    if (!selection) return;
    selection.onChange(allSelected ? [] : visibleIds);
  }

  function toggleOne(id: string) {
    if (!selection) return;
    const next = new Set(selectedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selection.onChange([...next]);
  }

  const primaryColumn = columns.find((column) => column.primary) ?? columns[0];

  if (loading) {
    return <LoadingState columns={columns.length} hasActions={Boolean(rowActions)} />;
  }

  if (sortedRows.length === 0) {
    return <>{empty ?? <div className="p-10 text-center text-sm text-steel">No records to show.</div>}</>;
  }

  return (
    <div>
      {selection && bulkActions && selection.selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-accent/8 px-4 py-3">
          <p className="text-sm font-semibold text-primary">
            {selection.selectedIds.length} selected
          </p>
          <div className="flex flex-wrap gap-2">{bulkActions(selection.selectedIds)}</div>
        </div>
      ) : null}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-start">
              {selection ? (
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 cursor-pointer accent-accent"
                  />
                </th>
              ) : null}
              {columns.map((column) => {
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-steel",
                      column.align === "end" ? "text-end" : "text-start",
                      column.className
                    )}
                  >
                    {column.sortable && column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded transition hover:text-primary",
                          active && "text-primary"
                        )}
                      >
                        {column.header}
                        {active ? (
                          sort?.direction === "asc" ? (
                            <ChevronUp size={14} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={14} aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown size={14} className="text-steel/60" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {rowActions ? <th scope="col" className="w-px px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const id = rowKey(row);
              const selected = selectedSet.has(id);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "group border-b border-border last:border-b-0 transition",
                    onRowClick && "cursor-pointer hover:bg-muted/60",
                    selected && "bg-accent/8"
                  )}
                >
                  {selection ? (
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOne(id)}
                        aria-label="Select row"
                        className="h-4 w-4 cursor-pointer accent-accent"
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 align-middle text-primary",
                        column.align === "end" ? "text-end" : "text-start",
                        column.className
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                  {rowActions ? (
                    <td className="px-4 py-3 text-end" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                        {rowActions(row)}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 p-3 md:hidden">
        {sortedRows.map((row) => {
          const id = rowKey(row);
          const selected = selectedSet.has(id);
          return (
            <div
              key={id}
              className={cn(
                "rounded-lg border border-border bg-white p-4",
                selected && "border-accent/40 bg-accent/8"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {selection ? (
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleOne(id)}
                      aria-label="Select row"
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-accent"
                    />
                  ) : null}
                  <div className="min-w-0">{primaryColumn.render(row)}</div>
                </div>
                {rowActions ? <div className="flex shrink-0 gap-1">{rowActions(row)}</div> : null}
              </div>
              <dl className="mt-3 grid gap-2">
                {columns
                  .filter((column) => column.key !== primaryColumn.key && !column.hideOnCard)
                  .map((column) => (
                    <div key={column.key} className="flex items-center justify-between gap-3">
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-steel">
                        {column.header}
                      </dt>
                      <dd className="text-end text-sm text-primary">{column.render(row)}</dd>
                    </div>
                  ))}
              </dl>
              {onRowClick ? (
                <button
                  type="button"
                  onClick={() => onRowClick(row)}
                  className="mt-3 w-full rounded-md border border-border bg-surface py-2 text-sm font-semibold text-primary transition hover:bg-muted"
                >
                  View details
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingState({ columns, hasActions }: { columns: number; hasActions: boolean }) {
  const cells = columns + (hasActions ? 1 : 0);
  return (
    <div>
      <div className="hidden md:block">
        <div className="grid gap-px">
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
              {Array.from({ length: cells }).map((__, cellIndex) => (
                <Skeleton key={cellIndex} className={cn("h-4 flex-1", cellIndex === 0 && "max-w-[40%]")} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
