"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePolling } from "@/hooks/use-polling";
import { fetchAllOrders, fetchRecentHistory } from "@/lib/api";
import { computeAdminMetrics, STALE_OVERDUE_DAYS, type StepQueue } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";
import {
  BarList,
  DashboardSkeleton,
  DeltaText,
  DueBadge,
  LiveIndicator,
  Panel,
  StatCard
} from "@/components/dashboard/parts";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

// Active orders change all the time; history only matters for trends.
const ACTIVE_REFRESH_MS = 15_000;
const HISTORY_REFRESH_MS = 5 * 60_000;
// ~1500 most recent finished orders covers a bit more than 90 days.
const HISTORY_LIMIT = 1500;

const JENIS_COLORS = ["bg-blue-800", "bg-blue-600", "bg-blue-400", "bg-blue-300", "bg-orange-600", "bg-orange-300"];

const NO_CHECKLIST = "Belum ada checklist";

function formatDays(d: number | null): string {
  if (d === null) return "–";
  return d < 1 ? "<1 hari" : `${d.toFixed(1).replace(".0", "")} hari`;
}

function bottleneckText(pipeline: StepQueue[]): string | null {
  const real = pipeline.filter((p) => p.step !== NO_CHECKLIST);
  if (!real.length) return null;
  const most = real[0];
  const slowest = real
    .filter((p) => p.avgWaitDays !== null && p.count >= 3)
    .sort((a, b) => (b.avgWaitDays ?? 0) - (a.avgWaitDays ?? 0))[0];
  if (slowest && slowest.step !== most.step) {
    return `Antrean terbanyak: ${most.step} (${most.count} folder). Paling lama menunggu: ${slowest.step}, rata-rata ${formatDays(slowest.avgWaitDays)}.`;
  }
  return `Antrean terbesar: ${most.step}, ${most.count} folder, rata-rata menunggu ${formatDays(most.avgWaitDays)}.`;
}

export function Dashboard() {
  const [range, setRange] = useState<Range>(30);

  const active = usePolling(useCallback(() => fetchAllOrders(), []), ACTIVE_REFRESH_MS);
  const history = usePolling(useCallback(() => fetchRecentHistory(HISTORY_LIMIT), []), HISTORY_REFRESH_MS);

  const metrics = useMemo(() => {
    // Wait for history too, otherwise "done this week" and turnaround briefly
    // show numbers computed from active orders only.
    if (!active.data || history.isLoading) return null;
    return computeAdminMetrics(active.data, history.data ?? [], new Date(), range);
    // lastUpdated changes on every refresh, so "now" stays current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.data, history.data, history.isLoading, range, active.lastUpdated]);

  if (!metrics) {
    return (
      <div className="p-4 pt-16 sm:p-6 lg:pt-6">
        {active.error ? (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            Gagal memuat data dashboard. Coba muat ulang halaman.
          </p>
        ) : (
          <DashboardSkeleton />
        )}
      </div>
    );
  }

  const m = metrics;
  const rangeText = `${range} hari terakhir`;
  const pipelineMaxWait = Math.max(
    ...m.pipeline.filter((p) => p.step !== NO_CHECKLIST && p.count >= 3).map((p) => p.avgWaitDays ?? 0),
    0
  );
  const jenisTotal = m.jenis.reduce((s, j) => s + j.count, 0) || 1;
  const bottleneck = bottleneckText(m.pipeline);

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col gap-6 p-4 pt-16 sm:p-6 lg:pt-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600">
            <LiveIndicator lastUpdated={active.lastUpdated} error={active.error} />
            <span aria-hidden="true">·</span>
            <span>{format(new Date(), "EEEE, d MMM yyyy", { locale: localeId })}</span>
          </p>
        </div>
        <div role="group" aria-label="Rentang waktu" className="flex gap-0.5 rounded-lg border border-gray-200 bg-white p-[3px]">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "min-h-9 rounded-md px-3.5 text-[13px]",
                range === r ? "bg-gray-900 font-semibold text-white" : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {r} hari
            </button>
          ))}
        </div>
      </header>

      <section aria-label="Angka utama" className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        <StatCard label="Sedang diproduksi" value={m.productionFolders} sub={`folder dari ${m.productionOrders} pesanan`} />
        <StatCard
          label="Terlambat"
          tone="late"
          value={m.overdueOrders}
          sub={
            m.staleOverdueOrders
              ? `pesanan, ${m.staleOverdueOrders} di antaranya lewat ${STALE_OVERDUE_DAYS}+ hari`
              : "pesanan lewat Estimasi Selesai"
          }
        />
        <StatCard label="Deadline hari ini" tone="today" value={m.dueTodayOrders} sub={`pesanan, ${m.dueWeekOrders} lagi dalam 7 hari`} />
        <StatCard
          label="Siap diambil"
          value={m.readyOrders}
          sub={m.readyOver7Days ? `${m.readyOver7Days} sudah >7 hari belum di-Finish` : "pesanan selesai, belum di-Finish"}
          subClassName={m.readyOver7Days ? "font-medium text-orange-800" : undefined}
        />
        <StatCard
          label="Folder selesai 7 hari"
          value={m.doneThisWeek}
          sub={<DeltaText current={m.doneThisWeek} previous={m.doneLastWeek} />}
        />
        <StatCard
          label="Median pengerjaan"
          value={m.medianTurnaroundDays === null ? "–" : m.medianTurnaroundDays.toFixed(1)}
          unit={m.medianTurnaroundDays === null ? undefined : "hari"}
          sub={`upload sampai selesai, ${rangeText}`}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Perlu perhatian"
          description="Terlambat dulu, lalu deadline terdekat"
          action={
            <Link href="/admin/semua-pesanan" className="text-[13px] font-medium text-blue-700 hover:text-blue-900">
              Lihat semua →
            </Link>
          }
        >
          {m.attention.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Tidak ada pesanan yang mendesak.</p>
          ) : (
            <ul className="flex flex-col">
              {m.attention.map((a) => (
                <li key={a.orderId} className="flex flex-wrap items-center gap-3 border-t border-gray-100 py-2.5">
                  <DueBadge due={a.due} className="min-w-24" />
                  <div className="flex min-w-0 flex-[1_1_200px] flex-col">
                    <span className="truncate text-sm font-medium text-gray-900">{a.kode}</span>
                    <span className="truncate text-xs text-gray-600">
                      {a.sender} · {a.jenis}
                    </span>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-800">{a.step}</span>
                </li>
              ))}
            </ul>
          )}
          {m.staleOverdueOrders > 0 && (
            <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-700">
              {m.staleOverdueOrders} pesanan terlambat lebih dari {STALE_OVERDUE_DAYS} hari tidak ditampilkan di sini.
              Kemungkinan sudah selesai tapi belum di-update. Cek di Semua Pesanan dengan filter Terlambat.
            </p>
          )}
        </Panel>

        <Panel title="Antrean produksi" description="Folder yang belum selesai, per tahap yang sedang ditunggu">
          <BarList
            metaHeader="Rata² tunggu"
            items={m.pipeline.map((p, i) => ({
              label: p.step,
              value: p.count,
              highlight: i === 0 && p.step !== NO_CHECKLIST,
              meta: formatDays(p.avgWaitDays),
              metaHighlight:
                p.step !== NO_CHECKLIST && p.count >= 3 && pipelineMaxWait > 0 && p.avgWaitDays === pipelineMaxWait
            }))}
          />
          {bottleneck && (
            <p className="rounded-lg bg-orange-50 px-3 py-2.5 text-xs text-orange-900">{bottleneck}</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Folder masuk vs selesai"
          description={range > 31 ? `Per minggu, ${rangeText}` : `Per hari, ${rangeText}`}
          action={
            <div className="flex gap-3.5 text-xs text-gray-700">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                Masuk
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-blue-300" />
                Selesai
              </span>
            </div>
          }
        >
          <div className="h-[220px]" role="img" aria-label={`Diagram folder masuk dan selesai, ${rangeText}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.volume} barGap={2} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <CartesianGrid vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} minTickGap={12} stroke="#4b5563" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={40} stroke="#4b5563" />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "#e5e7eb" }}
                />
                <Bar dataKey="incoming" name="Masuk" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="done" name="Selesai" fill="#93c5fd" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Jenis & ukuran" description={`Folder masuk, ${rangeText}`}>
          <div className="flex h-7 gap-0.5 overflow-hidden rounded-md" aria-hidden="true">
            {m.jenis.map((j, i) => (
              <div
                key={j.label}
                className={JENIS_COLORS[i % JENIS_COLORS.length]}
                style={{ width: `${(j.count / jenisTotal) * 100}%` }}
                title={`${j.label}: ${j.count}`}
              />
            ))}
          </div>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-4 gap-y-2">
            {m.jenis.map((j, i) => (
              <li key={j.label} className="flex items-center gap-2 text-[13px]">
                <span aria-hidden="true" className={cn("h-2.5 w-2.5 flex-none rounded-sm", JENIS_COLORS[i % JENIS_COLORS.length])} />
                <span className="flex-1 truncate text-gray-700">{j.label}</span>
                <span className="font-semibold tabular-nums">{j.count}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-3.5">
            <span className="text-[13px] font-semibold text-gray-700">Ukuran terlaris</span>
            <div className="flex flex-wrap gap-2">
              {m.ukuran.map((u) => (
                <span key={u.label} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px]">
                  <strong className="font-semibold">{u.label}</strong>{" "}
                  <span className="text-gray-600">· {u.count}</span>
                </span>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Beban kerja karyawan" description="Folder yang sedang dipegang tiap orang">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-gray-600">
                  <th scope="col" className="py-2 pr-2 font-medium">Karyawan</th>
                  <th scope="col" className="w-2/5 p-2 font-medium">Folder aktif</th>
                  <th scope="col" className="p-2 text-right font-medium">Terlambat</th>
                  <th scope="col" className="py-2 pl-2 text-right font-medium">Selesai 7 hari</th>
                </tr>
              </thead>
              <tbody>
                {m.workers.map((w) => {
                  const maxOpen = Math.max(...m.workers.map((x) => x.open), 1);
                  return (
                    <tr key={w.name} className="border-t border-gray-100">
                      <td className="py-3 pr-2 font-medium">{w.name}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${(w.open / maxOpen) * 100}%` }} />
                          </div>
                          <span className="min-w-6 text-right font-semibold tabular-nums">{w.open}</span>
                        </div>
                      </td>
                      <td className={cn("p-2 text-right font-semibold tabular-nums", w.late ? "text-red-700" : "text-gray-600")}>
                        {w.late}
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums">{w.doneWeek}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Pelanggan teratas" description={`Studio / pengirim dengan pesanan terbanyak, ${rangeText}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-gray-600">
                  <th scope="col" className="w-7 py-2 pr-2 font-medium">#</th>
                  <th scope="col" className="p-2 font-medium">Pengirim</th>
                  <th scope="col" className="p-2 text-right font-medium">Pesanan</th>
                  <th scope="col" className="p-2 text-right font-medium">Folder</th>
                  <th scope="col" className="py-2 pl-2 text-right font-medium">Terakhir order</th>
                </tr>
              </thead>
              <tbody>
                {m.customers.map((c, i) => (
                  <tr key={c.name} className="border-t border-gray-100">
                    <td className="py-2.5 pr-2 text-gray-600">{i + 1}</td>
                    <td className="p-2 font-medium">{c.name}</td>
                    <td className="p-2 text-right font-semibold tabular-nums">{c.orders}</td>
                    <td className="p-2 text-right tabular-nums">{c.folders}</td>
                    <td className="py-2 pl-2 text-right text-gray-600">{format(c.last, "d MMM", { locale: localeId })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
