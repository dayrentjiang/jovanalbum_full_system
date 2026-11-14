"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { markLunas, markTerkirim } from "@/lib/api";

export type StatusAction = "terkirim" | "lunas";

interface Target {
  _id: string;
  sender: { name: string };
}

interface Props {
  action: StatusAction;
  orders: Target[];
  /** Button that opens the dialog. */
  trigger: React.ReactNode;
  /** Called after the request, with the ids that failed (empty when all worked). */
  onDone?: (failedIds: string[]) => void;
}

const COPY: Record<StatusAction, { title: string; button: string; body: (n: number) => string }> = {
  terkirim: {
    title: "Tandai terkirim",
    button: "Tandai terkirim",
    body: (n) =>
      `${n === 1 ? "Pesanan ini" : `${n} pesanan ini`} sudah dikirim tapi belum lunas. ` +
      `Tetap ada di Semua Pesanan dengan status "Terkirim · belum lunas".`
  },
  lunas: {
    title: "Tandai lunas",
    button: "Tandai lunas",
    body: (n) =>
      `${n === 1 ? "Pesanan ini" : `${n} pesanan ini`} selesai dan pindah ke History. ` +
      `Folder Google Drive-nya dipindah ke sampah (bisa dipulihkan selama 30 hari).`
  }
};

/** Confirm, then mark one or many orders as terkirim or lunas. */
export function StatusActionDialog({ action, orders, trigger, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ name: string; error: string }[]>([]);
  const [okCount, setOkCount] = useState(0);
  const copy = COPY[action];
  const n = orders.length;

  const handleOpenChange = (next: boolean) => {
    if (busy) return;
    setOpen(next);
    if (next) setErrors([]);
  };

  const run = async () => {
    setBusy(true);
    setErrors([]);
    const ids = orders.map((o) => o._id);
    const nameOf = new Map(orders.map((o) => [o._id, o.sender?.name ?? o._id]));
    let failed: { id: string; error: string }[] = [];
    try {
      if (action === "terkirim") {
        await markTerkirim(ids);
      } else {
        const results = await markLunas(ids);
        failed = results.filter((r) => !r.ok).map((r) => ({ id: r.id, error: r.error ?? "Gagal" }));
      }
    } catch (err) {
      failed = ids.map((id) => ({ id, error: err instanceof Error ? err.message : "Gagal" }));
    }
    setBusy(false);
    onDone?.(failed.map((f) => f.id));
    if (failed.length === 0) {
      setOpen(false);
    } else {
      setOkCount(ids.length - failed.length);
      setErrors(failed.map((f) => ({ name: nameOf.get(f.id) ?? f.id, error: f.error })));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px] bg-white">
        <DialogHeader>
          <DialogTitle>
            {copy.title}
            {n > 1 ? ` (${n})` : ""}
          </DialogTitle>
          <DialogDescription>{copy.body(n)}</DialogDescription>
        </DialogHeader>

        <ul className="max-h-48 overflow-y-auto rounded-md border border-gray-200 text-sm">
          {orders.map((o) => (
            <li key={o._id} className="border-b border-gray-100 px-3 py-1.5 last:border-0">
              {o.sender?.name}
            </li>
          ))}
        </ul>

        {errors.length > 0 && (
          <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            <p className="font-medium">
              {errors.length} gagal{okCount > 0 ? `, ${okCount} berhasil` : ""}:
            </p>
            <ul className="mt-1 list-disc pl-5">
              {errors.map((e, i) => (
                <li key={i}>
                  {e.name}: {e.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={busy}>
            {errors.length > 0 ? "Tutup" : "Batal"}
          </Button>
          <Button
            onClick={run}
            disabled={busy}
            className={action === "lunas" ? "bg-green-600 text-white hover:bg-green-700" : "bg-orange-500 text-white hover:bg-orange-600"}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses…
              </>
            ) : errors.length > 0 ? (
              "Coba lagi"
            ) : (
              `${copy.button}${n > 1 ? ` (${n})` : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
