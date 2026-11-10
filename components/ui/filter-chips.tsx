"use client";

import { cn } from "@/lib/utils";

export interface FilterChip<K extends string> {
  key: K;
  label: string;
  count: number;
}

interface FilterChipsProps<K extends string> {
  chips: FilterChip<K>[];
  value: K;
  onChange: (key: K) => void;
  label?: string;
}

/** Quick filters with live counts, e.g. "Terlambat 6". */
export function FilterChips<K extends string>({ chips, value, onChange, label = "Filter cepat" }: FilterChipsProps<K>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = chip.key === value;
        return (
          <button
            key={chip.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.key)}
            className={cn(
              "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors",
              active
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            {chip.label}
            <span
              className={cn(
                "rounded-full px-2 py-px text-xs font-semibold",
                active ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-700"
              )}
            >
              {chip.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
