"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/use-polling";
import { fetchRecentHistory, fetchWorkerEntries } from "@/lib/api";
import { useWorkers } from "@/hooks/use-workers";
import { computeWorkerMetrics } from "@/lib/dashboard-metrics";
import { jenisLabel } from "@/lib/orders";
import {
  BarList,
  DashboardSkeleton,
  DeltaText,
  DueBadge,
  LiveIndicator,
  Panel,
  StatCard
} from "@/components/dashboard/parts";
import WorkerConfirmationBox from "./workerConfirmationBox";

const REFRESH_MS = 15_000;
const HISTORY_REFRESH_MS = 5 * 60_000;
// Enough recent history to count this and last week's finished folders.
const HISTORY_LIMIT = 500;

function formatDays(d: number | null): string {
  if (d === null) return "–";
  return d < 1 ? "<1 hari" : `${d.toFixed(1).replace(".0", "")} hari`;
}

export function WorkerDashboard({ userId }: { userId: string }) {
  const { user } = useUser();
  const users = useWorkers();

  const entries = usePolling(useCallback(() => fetchWorkerEntries(userId), [userId]), REFRESH_MS);
  const history = usePolling(useCallback(() => fetchRecentHistory(HISTORY_LIMIT), []), HISTORY_REFRESH_MS);

  const metrics = useMemo(() => {
    // Wait for history so "done this week" isn't briefly undercounted.
    if (!entries.data || history.isLoading) return null;
    return computeWorkerMetrics(entries.data, history.data ?? [], userId, new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.data, history.data, history.isLoading, userId, entries.lastUpdated]);

  const name = user?.firstName || user?.username || "";

  if (!metrics) {
    return (
      <div className="p-4 pt-16 sm:p-6 lg:pt-6">
        {entries.error ? (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">Gagal memuat pesanan. Coba muat ulang halaman.</p>
        ) : (
          <DashboardSkeleton />
        )}
      </div>
    );
  }

  const m = metrics;
  const weekMax = Math.max(...m.week.map((d) => d.count), 1);
  const summary =
    m.openFolders === 0
      ? "Tidak ada folder yang sedang kamu kerjakan."
      : m.overdue > 0
        ? `Kamu pegang ${m.openFolders} folder. ${m.overdue} sudah lewat deadline, kerjakan itu dulu.`
        : `Kamu pegang ${m.openFolders} folder. Semua masih sesuai jadwal.`;

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col gap-6 p-4 pt-16 sm:p-6 lg:pt-7">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-800">{name ? `Halo, ${name}` : "Dashboard"}</h1>
        <p className="text-sm text-gray-700">{summary}</p>
        <LiveIndicator lastUpdated={entries.lastUpdated} error={entries.error} />
      </header>

      <section aria-label="Angka saya" className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        <StatCard label="Folder saya" value={m.openFolders} sub={`belum selesai, dari ${m.openOrders} pesanan`} />
        <StatCard label="Terlambat" tone="late" value={m.overdue} sub="folder lewat Estimasi Selesai" />
        <StatCard label="Deadline hari ini" tone="today" value={m.dueToday} sub={`${m.dueTomorrow} lagi besok`} />
        <StatCard
          label="Selesai 7 hari"
          value={m.doneThisWeek}
          sub={<DeltaText current={m.doneThisWeek} previous={m.doneLastWeek} />}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Kerjakan berikutnya"
          description="Diurutkan dari deadline paling dekat"
          action={
            <Link href="/user/semua-pesanan" className="text-[13px] font-medium text-blue-700 hover:text-blue-900">
              Semua pesanan →
            </Link>
          }
        >
          {m.next.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Tidak ada folder yang menunggu.</p>
          ) : (
            <ul className="flex flex-col">
              {m.next.map(({ entry, due, progress }) => (
                <li key={entry.folder._id} className="flex flex-wrap items-center gap-3 border-t border-gray-100 py-2.5">
                  {due ? (
                    <DueBadge due={due} className="min-w-24" />
                  ) : (
                    <span className="min-w-24 text-center text-xs text-gray-500">Tanpa deadline</span>
                  )}
                  <div className="flex min-w-0 flex-[1_1_200px] flex-col">
                    <span className="truncate text-sm font-medium text-gray-900">{entry.folder.kodeOrder || "-"}</span>
                    <span className="truncate text-xs text-gray-600">
                      {entry.order.sender?.name} · {jenisLabel(entry.folder)} · berikutnya: {progress.next ?? "-"}
                    </span>
                  </div>
                  <WorkerConfirmationBox
                    button={
                      <Button variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100">
                        Accept
                      </Button>
                    }
                    type={entry.folder.tipe}
                    users={users}
                    order={entry}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Folder saya per tahap" description="Tahap yang sedang ditunggu folder-folder saya">
            <BarList
              metaHeader="Rata² tunggu"
              items={m.steps.map((s) => ({ label: s.step, value: s.count, meta: formatDays(s.avgWaitDays) }))}
              emptyText="Tidak ada folder terbuka"
            />
          </Panel>

          <Panel title="Selesai per hari" description="Folder yang saya selesaikan, 7 hari terakhir">
            <div
              className="flex h-32 items-end gap-2.5 border-b border-gray-200"
              role="img"
              aria-label={`Folder selesai per hari: ${m.week.map((d) => `${d.label} ${d.count}`).join(", ")}`}
            >
              {m.week.map((d, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[11px] font-semibold text-gray-700 tabular-nums">{d.count}</span>
                  <div
                    className="w-[70%] rounded-t bg-blue-600"
                    style={{ height: `${Math.max(3, (d.count / weekMax) * 85)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="-mt-1.5 flex gap-2.5">
              {m.week.map((d, i) => (
                <span key={i} className="flex-1 text-center text-[11px] text-gray-600">
                  {d.label}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;
