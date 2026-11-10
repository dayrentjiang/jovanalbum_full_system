"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
