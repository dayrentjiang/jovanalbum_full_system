// Shared order types and helpers for reading production progress and deadlines.
//
// A folder's progress lives in `stepChecklist`, e.g.
//   ["Admin - Terima (done), 05-Nov 14:18", "Bojes - Cetak (done), 06-Nov 09:02", "Bojes - Selesai"]
// The backend stamps the time a step was ticked as "dd-Mon HH:mm" without a year,
// so the year is inferred from the order's upload date.

export const DAY_MS = 24 * 60 * 60 * 1000;

export interface OrderFolder {
  _id: string;
  orderId?: string;
  tipe: string;
  ukuran: string;
  description: string;
  workingDescription?: string;
  driveLink?: string;
  subFolderId: string;
  status?: string;
  assignee?: string;
  assigneeName?: string;
  orderStatusNow?: string[];
  kodeOrder: string;
  stepChecklist: string[];
}

export interface OrderRecord {
  _id: string;
  trackingId?: string;
  sender: { name: string; whatsapp: string };
  folders: OrderFolder[];
  mainFolderId: string;
  uploadDate: string;
  status: string;
  estimatedFinish?: string | null;
  workingNotes?: string;
}

/** One row of `/order/user/:userId`: a single folder plus its parent order. */
export interface WorkerEntry {
  order: OrderRecord;
  folder: OrderFolder;
}

/** Order statuses that are still being produced (not yet all steps done). */
export const IN_PRODUCTION_STATUSES = ["pending", "new", "on-process"];

export function isInProduction(order: Pick<OrderRecord, "status">): boolean {
  return IN_PRODUCTION_STATUSES.includes(order.status);
}

// ---------------------------------------------------------------------------
// Steps

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mei: 4, jun: 5, jul: 6,
  aug: 7, agu: 7, agt: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11, des: 11
};

const STAMP_RE = /(\d{1,2})-([A-Za-z]{3})\s+(\d{1,2}):(\d{2})/;
const TRAILING_STAMP_RE = /,?\s*\d{1,2}-[A-Za-z]{3}\s+\d{1,2}:\d{2}\s*$/;

export interface ParsedStep {
  label: string;
  done: boolean;
  at: Date | null;
}

/** Parse "dd-Mon HH:mm" relative to a reference date (the upload date). */
export function parseStepStamp(raw: string, ref: Date): Date | null {
  const m = raw.match(STAMP_RE);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  const year = isNaN(ref.getTime()) ? new Date().getFullYear() : ref.getFullYear();
  const at = new Date(year, month, Number(m[1]), Number(m[3]), Number(m[4]));
  // Steps happen after upload. A stamp far before the upload date belongs to
  // the next year (uploaded in late Dec, finished in Jan).
  if (!isNaN(ref.getTime()) && at.getTime() < ref.getTime() - 30 * DAY_MS) {
    at.setFullYear(year + 1);
  }
  return at;
}

export function parseStep(raw: string, ref: Date): ParsedStep {
  const done = raw.includes("(done)");
  const label = raw
    .replace(/\s*\(done\)/, "")
    .replace(TRAILING_STAMP_RE, "")
    .trim();
  return { label, done, at: parseStepStamp(raw, ref) };
}

export interface FolderProgress {
  total: number;
  doneCount: number;
  /** 0..1, used to sort by "how far along". */
  ratio: number;
  /** Last ticked step, e.g. "Bojes - Kirim ke Azis". */
  current: string | null;
  currentAt: Date | null;
  /** First step not ticked yet: what the folder is waiting for. */
  next: string | null;
  finished: boolean;
  finishedAt: Date | null;
}

export function folderProgress(folder: Pick<OrderFolder, "stepChecklist">, uploadDate: string): FolderProgress {
  const ref = new Date(uploadDate);
  const steps = (folder.stepChecklist ?? []).map((s) => parseStep(s, ref));
  const total = steps.length;
  const done = steps.filter((s) => s.done);
  const last = done[done.length - 1] ?? null;
  const finished = total > 0 && steps[total - 1].done;
  return {
    total,
    doneCount: done.length,
    ratio: total ? done.length / total : 0,
    current: last?.label ?? null,
    currentAt: last?.at ?? null,
    next: steps.find((s) => !s.done)?.label ?? null,
    finished,
    finishedAt: finished ? steps[total - 1].at : null
  };
}

/** Tailwind classes for the status pill, matching the existing worker table colours. */
export function progressTone(p: FolderProgress): string {
  if (p.finished) return "bg-green-100 text-green-800";
  if (!p.current) return "bg-gray-100 text-gray-800";
  if (p.current.includes("Admin - Terima")) return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
}

// ---------------------------------------------------------------------------
// Deadlines

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole calendar days between two dates (b - a), DST-safe. */
export function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

export type DueTone = "late" | "today" | "soon" | "later";

export interface DueInfo {
  date: Date;
  /** Days until due; negative when late. */
  diff: number;
  tone: DueTone;
  label: string;
}

export function dueInfo(value: string | Date | null | undefined, now: Date = new Date()): DueInfo | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  const diff = dayDiff(now, date);
  if (diff < 0) return { date, diff, tone: "late", label: `${-diff} hari telat` };
  if (diff === 0) return { date, diff, tone: "today", label: "Hari ini" };
  if (diff === 1) return { date, diff, tone: "soon", label: "Besok" };
  return { date, diff, tone: "later", label: `${diff} hari lagi` };
}

export const DUE_TONE_CLASS: Record<DueTone, string> = {
  late: "bg-red-100 text-red-800",
  today: "bg-orange-100 text-orange-800",
  soon: "bg-gray-100 text-gray-700",
  later: "bg-gray-100 text-gray-600"
};

// ---------------------------------------------------------------------------
// Misc

/** "GOLDIX" and "Goldix " are the same customer. */
export function customerKey(name: string | undefined): string {
  return (name ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function jenisLabel(folder: Pick<OrderFolder, "tipe" | "ukuran">): string {
  return [folder.tipe, folder.ukuran].filter(Boolean).join(" ");
}
