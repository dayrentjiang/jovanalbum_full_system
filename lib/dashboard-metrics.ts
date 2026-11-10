// Pure functions that turn raw orders into dashboard numbers.
// Kept free of React so they are easy to test against real API data.

import {
  DAY_MS,
  OrderFolder,
  OrderRecord,
  WorkerEntry,
  customerKey,
  dueInfo,
  DueInfo,
  folderProgress,
  FolderProgress,
  isInProduction,
  jenisLabel,
  startOfDay
} from "./orders";

export interface CountItem {
  label: string;
  count: number;
}

export interface StepQueue {
  step: string;
  count: number;
  /** Average days since the folder's previous step was ticked. */
  avgWaitDays: number | null;
}

export interface VolumePoint {
  label: string;
  incoming: number;
  done: number;
}

export interface AttentionItem {
  orderId: string;
  due: DueInfo;
  kode: string;
  sender: string;
  jenis: string;
  step: string;
}

export interface WorkerLoad {
  name: string;
  open: number;
  late: number;
  doneWeek: number;
}

export interface CustomerStat {
  name: string;
  orders: number;
  folders: number;
  last: Date;
}

/** Orders this many days past due are most likely forgotten, not urgent. */
export const STALE_OVERDUE_DAYS = 30;

export interface AdminMetrics {
  productionOrders: number;
  productionFolders: number;
  readyOrders: number;
  /** Ready orders whose last folder was finished more than 7 days ago. */
  readyOver7Days: number;
  overdueOrders: number;
  /** Subset of overdueOrders that are more than STALE_OVERDUE_DAYS late. */
  staleOverdueOrders: number;
  dueTodayOrders: number;
  dueWeekOrders: number;
  doneThisWeek: number;
  doneLastWeek: number;
  medianTurnaroundDays: number | null;
  attention: AttentionItem[];
  pipeline: StepQueue[];
  volume: VolumePoint[];
  jenis: CountItem[];
  ukuran: CountItem[];
  workers: WorkerLoad[];
  customers: CustomerStat[];
}

interface FolderCtx {
  order: OrderRecord;
  folder: OrderFolder;
  progress: FolderProgress;
}

const UNASSIGNED = "Belum di-assign";
const NO_CHECKLIST = "Belum ada checklist";

function dedupeOrders(...lists: OrderRecord[][]): OrderRecord[] {
  const seen = new Map<string, OrderRecord>();
  for (const list of lists) for (const o of list) if (!seen.has(o._id)) seen.set(o._id, o);
  return [...seen.values()];
}

function folderContexts(orders: OrderRecord[]): FolderCtx[] {
  return orders.flatMap((order) =>
    (order.folders ?? []).map((folder) => ({
      order,
      folder,
      progress: folderProgress(folder, order.uploadDate)
    }))
  );
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function inWindow(d: Date | null, from: number, to: number): boolean {
  return !!d && d.getTime() >= from && d.getTime() < to;
}

function workerName(folder: OrderFolder): string {
  if (!folder.assignee || folder.assignee === "Unassigned") return UNASSIGNED;
  return folder.assigneeName || folder.assignee;
}

/** Group by a case-insensitive key, keeping the first spelling seen. */
function countBy<T>(items: T[], keyOf: (t: T) => string): Map<string, { label: string; items: T[] }> {
  const map = new Map<string, { label: string; items: T[] }>();
  for (const it of items) {
    const label = keyOf(it);
    const key = label.toLowerCase();
    const entry = map.get(key);
    if (entry) entry.items.push(it);
    else map.set(key, { label, items: [it] });
  }
  return map;
}

function stepQueues(ctxs: FolderCtx[], now: Date, limit: number): StepQueue[] {
  const groups = countBy(ctxs, (c) => c.progress.next ?? NO_CHECKLIST);
  return [...groups.values()]
    .map(({ label, items }) => {
      const waits = items.map((c) => {
        const since = c.progress.currentAt ?? new Date(c.order.uploadDate);
        return (now.getTime() - since.getTime()) / DAY_MS;
      }).filter((w) => isFinite(w) && w >= 0);
      return {
        step: label,
        count: items.length,
        avgWaitDays: waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : null
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function topCounts(labels: string[], limit: number, otherLabel?: string): CountItem[] {
  const groups = countBy(labels, (l) => l || "Lainnya");
  const sorted = [...groups.values()]
    .map(({ label, items }) => ({ label, count: items.length }))
    .sort((a, b) => b.count - a.count);
  if (!otherLabel || sorted.length <= limit) return sorted.slice(0, limit);
  const head = sorted.slice(0, limit - 1);
  const rest = sorted.slice(limit - 1).reduce((s, i) => s + i.count, 0);
  return [...head, { label: otherLabel, count: rest }];
}

const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const dayLabel = (d: Date) => `${d.getDate()} ${SHORT_MONTH[d.getMonth()]}`;

/**
 * Incoming (by upload date) vs done (by last step stamp) folders.
 * Daily buckets up to 31 days, weekly beyond that.
 */
function volumeSeries(ctxs: FolderCtx[], now: Date, rangeDays: number): VolumePoint[] {
  const bucketDays = rangeDays > 31 ? 7 : 1;
  const buckets = Math.ceil(rangeDays / bucketDays);
  const end = startOfDay(now).getTime() + DAY_MS; // exclusive, end of today
  const start = end - buckets * bucketDays * DAY_MS;
  const points: VolumePoint[] = Array.from({ length: buckets }, (_, i) => {
    const from = new Date(start + i * bucketDays * DAY_MS);
    return { label: dayLabel(from), incoming: 0, done: 0 };
  });
  const idx = (t: number) => Math.floor((t - start) / (bucketDays * DAY_MS));
  for (const c of ctxs) {
    const up = new Date(c.order.uploadDate).getTime();
    if (up >= start && up < end) points[idx(up)].incoming++;
    const fin = c.progress.finishedAt?.getTime();
    if (fin !== undefined && fin >= start && fin < end) points[idx(fin)].done++;
  }
  return points;
}

export function computeAdminMetrics(
  active: OrderRecord[],
  history: OrderRecord[],
  now: Date = new Date(),
  rangeDays = 30
): AdminMetrics {
  const all = dedupeOrders(active, history);
  const allCtx = folderContexts(all);
  const production = active.filter(isInProduction);
  const productionCtx = folderContexts(production).filter((c) => !c.progress.finished);

  const dues = production.map((o) => dueInfo(o.estimatedFinish, now));
  const overdueOrders = dues.filter((d) => d && d.diff < 0).length;
  const staleOverdueOrders = dues.filter((d) => d && d.diff < -STALE_OVERDUE_DAYS).length;
  const ready = active.filter((o) => o.status === "complete");
  const readyOver7Days = ready.filter((o) => {
    const times = (o.folders ?? [])
      .map((f) => folderProgress(f, o.uploadDate).finishedAt?.getTime())
      .filter((t): t is number => t !== undefined);
    return times.length > 0 && now.getTime() - Math.max(...times) > 7 * DAY_MS;
  }).length;
  const dueTodayOrders = dues.filter((d) => d && d.diff === 0).length;
  const dueWeekOrders = dues.filter((d) => d && d.diff > 0 && d.diff <= 7).length;

  const nowMs = now.getTime();
  const doneThisWeek = allCtx.filter((c) => inWindow(c.progress.finishedAt, nowMs - 7 * DAY_MS, nowMs + 1)).length;
  const doneLastWeek = allCtx.filter((c) => inWindow(c.progress.finishedAt, nowMs - 14 * DAY_MS, nowMs - 7 * DAY_MS)).length;

  const rangeStart = startOfDay(now).getTime() - (rangeDays - 1) * DAY_MS;
  const turnaround = allCtx
    .filter((c) => inWindow(c.progress.finishedAt, rangeStart, nowMs + 1))
    .map((c) => (c.progress.finishedAt!.getTime() - new Date(c.order.uploadDate).getTime()) / DAY_MS)
    .filter((d) => d >= 0 && d < 180);

  // Orders closest to (or past) their deadline, least-advanced folder first.
  const attention: AttentionItem[] = production
    .map((order, i) => ({ order, due: dues[i] }))
    .filter((x): x is { order: OrderRecord; due: DueInfo } => !!x.due && x.due.diff >= -STALE_OVERDUE_DAYS)
    .sort((a, b) => a.due.diff - b.due.diff)
    .slice(0, 8)
    .map(({ order, due }) => {
      const folders = order.folders ?? [];
      const progresses = folders.map((f) => folderProgress(f, order.uploadDate));
      const slowest = progresses.reduce<FolderProgress | null>(
        (min, p) => (!min || p.ratio < min.ratio ? p : min),
        null
      );
      const first = folders[0];
      return {
        orderId: order._id,
        due,
        kode: first ? first.kodeOrder + (folders.length > 1 ? ` +${folders.length - 1}` : "") : "-",
        sender: order.sender?.name ?? "-",
        jenis: first ? jenisLabel(first) : "-",
        step: slowest?.current ?? "Belum mulai"
      };
    });

  const rangeCtx = allCtx.filter((c) => new Date(c.order.uploadDate).getTime() >= rangeStart);

  const workerGroups = new Map<string, WorkerLoad>();
  const load = (name: string) => {
    let w = workerGroups.get(name);
    if (!w) workerGroups.set(name, (w = { name, open: 0, late: 0, doneWeek: 0 }));
    return w;
  };
  for (const c of productionCtx) {
    const w = load(workerName(c.folder));
    w.open++;
    const d = dueInfo(c.order.estimatedFinish, now);
    if (d && d.diff < 0) w.late++;
  }
  for (const c of allCtx) {
    if (inWindow(c.progress.finishedAt, nowMs - 7 * DAY_MS, nowMs + 1)) {
      const name = workerName(c.folder);
      if (name !== UNASSIGNED) load(name).doneWeek++;
    }
  }

  const customerGroups = new Map<string, CustomerStat>();
  for (const o of all) {
    const up = new Date(o.uploadDate);
    if (up.getTime() < rangeStart) continue;
    const key = customerKey(o.sender?.name);
    if (!key) continue;
    const c = customerGroups.get(key);
    if (c) {
      c.orders++;
      c.folders += o.folders?.length ?? 0;
      if (up > c.last) c.last = up;
    } else {
      customerGroups.set(key, { name: o.sender.name.trim(), orders: 1, folders: o.folders?.length ?? 0, last: up });
    }
  }

  return {
    productionOrders: production.length,
    productionFolders: productionCtx.length,
    readyOrders: ready.length,
    readyOver7Days,
    overdueOrders,
    staleOverdueOrders,
    dueTodayOrders,
    dueWeekOrders,
    doneThisWeek,
    doneLastWeek,
    medianTurnaroundDays: median(turnaround),
    attention,
    pipeline: stepQueues(productionCtx, now, 8),
    volume: volumeSeries(allCtx, now, rangeDays),
    jenis: topCounts(rangeCtx.map((c) => c.folder.tipe), 6, "Lainnya"),
    ukuran: topCounts(rangeCtx.map((c) => c.folder.ukuran), 6),
    workers: [...workerGroups.values()].sort((a, b) => b.open - a.open),
    customers: [...customerGroups.values()]
      .sort((a, b) => b.orders - a.orders || b.folders - a.folders)
      .slice(0, 8)
  };
}

// ---------------------------------------------------------------------------
// Worker

export interface WorkerNextItem {
  entry: WorkerEntry;
  due: DueInfo | null;
  progress: FolderProgress;
}

export interface WorkerMetrics {
  openFolders: number;
  openOrders: number;
  overdue: number;
  dueToday: number;
  dueTomorrow: number;
  doneThisWeek: number;
  doneLastWeek: number;
  next: WorkerNextItem[];
  steps: StepQueue[];
  week: { label: string; count: number }[];
}

const WEEKDAY = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function computeWorkerMetrics(
  entries: WorkerEntry[],
  history: OrderRecord[],
  userId: string,
  now: Date = new Date()
): WorkerMetrics {
  const items = entries
    .filter((e) => e?.order && e?.folder)
    .map((e) => ({
      entry: e,
      due: dueInfo(e.order.estimatedFinish, now),
      progress: folderProgress(e.folder, e.order.uploadDate)
    }));
  const open = items.filter((i) => !i.progress.finished);

  // Finished folders: still-active ones plus this worker's folders in history.
  const finished = new Map<string, Date>();
  for (const i of items) if (i.progress.finishedAt) finished.set(i.entry.folder._id, i.progress.finishedAt);
  for (const o of history) {
    for (const f of o.folders ?? []) {
      if (f.assignee !== userId || finished.has(f._id)) continue;
      const p = folderProgress(f, o.uploadDate);
      if (p.finishedAt) finished.set(f._id, p.finishedAt);
    }
  }
  const finishedTimes = [...finished.values()].map((d) => d.getTime());
  const nowMs = now.getTime();
  const countIn = (from: number, to: number) => finishedTimes.filter((t) => t >= from && t < to).length;

  const today = startOfDay(now).getTime();
  const week = Array.from({ length: 7 }, (_, i) => {
    const from = today - (6 - i) * DAY_MS;
    return { label: WEEKDAY[new Date(from).getDay()], count: countIn(from, from + DAY_MS) };
  });

  const next = [...open]
    .sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.diff - b.due.diff || a.progress.ratio - b.progress.ratio;
    })
    .slice(0, 8);

  const queueCtx: FolderCtx[] = open.map((i) => ({ order: i.entry.order, folder: i.entry.folder, progress: i.progress }));

  return {
    openFolders: open.length,
    openOrders: new Set(open.map((i) => i.entry.order._id)).size,
    overdue: open.filter((i) => i.due && i.due.diff < 0).length,
    dueToday: open.filter((i) => i.due && i.due.diff === 0).length,
    dueTomorrow: open.filter((i) => i.due && i.due.diff === 1).length,
    doneThisWeek: countIn(nowMs - 7 * DAY_MS, nowMs + 1),
    doneLastWeek: countIn(nowMs - 14 * DAY_MS, nowMs - 7 * DAY_MS),
    next,
    steps: stepQueues(queueCtx, now, 6),
    week
  };
}
