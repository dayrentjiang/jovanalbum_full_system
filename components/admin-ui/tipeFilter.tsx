"use client";

import { Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  /** Every type with how many orders (under the other filters) have it. */
  options: { tipe: string; count: number }[];
  /** Checked types; empty means no filter. */
  value: string[];
  onChange: (next: string[]) => void;
}

/** Funnel button in the Tipe header: tick one or more types to show. */
export function TipeFilter({ options, value, onChange }: Props) {
  const active = value.length > 0;
  const toggle = (tipe: string) =>
    onChange(value.includes(tipe) ? value.filter((t) => t !== tipe) : [...value, tipe]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={active ? `Filter tipe (${value.length} dipilih)` : "Filter tipe"}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold",
            "hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            active ? "text-blue-700" : "text-gray-400"
          )}
        >
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          {active && <span>{value.length}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 bg-white p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Tampilkan tipe</span>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={!active}
            className="text-xs font-medium text-blue-700 hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            Hapus filter
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {options.map(({ tipe, count }) => {
            const id = `tipe-${tipe}`;
            return (
              <li key={tipe}>
                <label
                  htmlFor={id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50",
                    count === 0 && !value.includes(tipe) && "text-gray-400"
                  )}
                >
                  <Checkbox id={id} checked={value.includes(tipe)} onCheckedChange={() => toggle(tipe)} />
                  <span className="flex-1">{tipe}</span>
                  <span className="text-xs tabular-nums text-gray-500">{count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
