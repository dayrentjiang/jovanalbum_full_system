"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { DUE_TONE_CLASS, type DueInfo } from "@/lib/orders";

type Tone = "default" | "late" | "today";

const TONE: Record<Tone, { card: string; label: string; value: string; sub: string }> = {
  default: { card: "bg-white border-gray-200", label: "text-gray-600 font-medium", value: "text-gray-900", sub: "text-gray-600" },
  late: { card: "bg-red-50 border-red-200", label: "text-red-800 font-semibold", value: "text-red-800", sub: "text-red-800" },
  today: { card: "bg-orange-50 border-orange-200", label: "text-orange-800 font-semibold", value: "text-orange-800", sub: "text-orange-800" }
};

export function StatCard({
  label,
  value,
  unit,
  sub,
  subClassName,
  tone = "default"
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: React.ReactNode;
  subClassName?: string;
  tone?: Tone;
}) {
  const t = TONE[tone];
  return (
    <div className={cn("flex flex-col gap-1.5 rounded-xl border px-5 py-4", t.card)}>
      <span className={cn("text-[13px]", t.label)}>{label}</span>
      <span className={cn("text-3xl font-bold tracking-tight tabular-nums", t.value)}>
        {value}
        {unit && <span className="ml-1 text-base font-medium text-gray-600">{unit}</span>}
      </span>
      {sub && <span className={cn("text-xs", subClassName ?? t.sub)}>{sub}</span>}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-3.5 rounded-xl border border-gray-200 bg-white p-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-gray-600">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DueBadge({ due, className }: { due: DueInfo | null; className?: string }) {
  if (!due) return null;
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-center text-xs font-semibold",
        DUE_TONE_CLASS[due.tone],
        className
      )}
    >
      {due.label}
    </span>
  );
}

export interface BarItem {
  label: string;
  value: number;
  highlight?: boolean;
  /** Small muted text after the value, e.g. "~4 hari". */
  meta?: string;
  metaHighlight?: boolean;
}

/** Horizontal bars: label | bar | value | meta. */
export function BarList({
  items,
  emptyText = "Belum ada data",
  metaHeader
}: {
  items: BarItem[];
  emptyText?: string;
  metaHeader?: string;
}) {
  if (!items.length) return <p className="py-6 text-center text-sm text-gray-500">{emptyText}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  const hasMeta = items.some((i) => i.meta !== undefined);
  const cols = hasMeta
    ? "grid-cols-[minmax(100px,190px)_1fr_auto_5.5rem]"
    : "grid-cols-[minmax(100px,190px)_1fr_auto]";
  return (
    <div className="flex flex-col gap-2.5">
      {hasMeta && metaHeader && (
        <div className={cn("grid gap-3 text-xs text-gray-600", cols)}>
          <span />
          <span />
          <span className="text-right">Folder</span>
          <span className="text-right">{metaHeader}</span>
        </div>
      )}
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.label} className={cn("grid items-center gap-3", cols)}>
            <span className="truncate text-[13px] text-gray-700" title={item.label}>
              {item.label}
            </span>
            <div className="h-5 overflow-hidden rounded-md bg-gray-100">
              <div
                className={cn("h-full rounded-md", item.highlight ? "bg-orange-600" : "bg-blue-600")}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="min-w-8 text-right text-[13px] font-semibold tabular-nums">{item.value}</span>
            {hasMeta && (
              <span
                className={cn(
                  "text-right text-xs tabular-nums",
                  item.metaHighlight ? "font-semibold text-orange-800" : "text-gray-600"
                )}
              >
                {item.meta ?? "–"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Live · diperbarui 12 detik lalu", re-rendered every few seconds. */
export function LiveIndicator({ lastUpdated, error }: { lastUpdated: Date | null; error: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  if (error && !lastUpdated) {
    return <span className="text-sm text-red-700">{error}</span>;
  }
  const seconds = lastUpdated ? Math.max(0, Math.round((now - lastUpdated.getTime()) / 1000)) : null;
  const ago =
    seconds === null ? "memuat…" : seconds < 10 ? "baru saja" : seconds < 60 ? `${seconds} detik lalu` : `${Math.round(seconds / 60)} menit lalu`;
  return (
    <span className="flex items-center gap-2 text-sm text-gray-600">
      <span
        aria-hidden="true"
        className={cn("inline-block h-2 w-2 rounded-full", error ? "bg-orange-500" : "bg-green-600")}
      />
      {error ? `Koneksi terputus, data terakhir ${ago}` : `Live · diperbarui ${ago}`}
    </span>
  );
}

export function DeltaText({ current, previous, suffix = "vs minggu lalu" }: { current: number; previous: number; suffix?: string }) {
  const diff = current - previous;
  if (diff === 0) return <span className="text-gray-600">Sama dengan minggu lalu</span>;
  return (
    <span className={cn("font-medium", diff > 0 ? "text-green-700" : "text-red-700")}>
      {diff > 0 ? "▲" : "▼"} {Math.abs(diff)} {suffix}
    </span>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Memuat dashboard">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-xl bg-gray-100" />
        <div className="h-72 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
