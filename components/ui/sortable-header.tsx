"use client";

import { useCallback, useState } from "react";
import type { Column, OnChangeFn, SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Sorting state that falls back to a default order instead of "unsorted".
 * Clicking a header cycles: first direction → other direction → default.
 * Pass a module-level constant so the reference is stable.
 */
export function useDefaultSorting(defaultSorting: SortingState) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);

  const onSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) =>
      setSorting((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return next.length ? next : defaultSorting;
      }),
    [defaultSorting]
  );

  const reset = useCallback(() => setSorting(defaultSorting), [defaultSorting]);
  const isDefault =
    sorting.length === defaultSorting.length &&
    sorting.every((s, i) => s.id === defaultSorting[i].id && s.desc === defaultSorting[i].desc);

  return { sorting, onSortingChange, reset, isDefault };
}

/** "Kembali ke urutan awal": only shown when the table isn't in its default order. */
export function SortResetButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
    >
      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
      Kembali ke urutan awal
    </button>
  );
}

interface SortableHeaderProps<T> {
  column: Column<T, unknown> | undefined;
  children: React.ReactNode;
  className?: string;
}

/** A table header that sorts its TanStack column on click (asc ⇄ desc). */
export function SortableHeader<T>({ column, children, className }: SortableHeaderProps<T>) {
  if (!column) return <TableHead className={cn("font-semibold", className)}>{children}</TableHead>;

  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <TableHead
      className={cn("px-1", className)}
      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
    >
      <button
        type="button"
        onClick={column.getToggleSortingHandler()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left font-semibold whitespace-nowrap",
          "hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          sorted ? "text-blue-700" : "text-gray-900"
        )}
      >
        {children}
        <Icon className={cn("h-3.5 w-3.5 shrink-0", sorted ? "text-blue-700" : "text-gray-400")} aria-hidden="true" />
      </button>
    </TableHead>
  );
}
