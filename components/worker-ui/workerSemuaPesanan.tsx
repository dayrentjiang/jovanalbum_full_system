"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SortableHeader } from "@/components/ui/sortable-header";
import { FilterChips } from "@/components/ui/filter-chips";
import { DueBadge } from "@/components/dashboard/parts";
import { Search } from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";
import WorkerConfirmationBox from "./workerConfirmationBox";
import {
  dueInfo,
  folderProgress,
  jenisLabel,
  progressTone,
  type DueInfo,
  type FolderProgress
} from "@/lib/orders";

interface Order {
  order: {
    _id: string;
    trackingId: string;
    sender: {
      name: string;
      whatsapp: string;
    };
    uploadDate: string;
    estimatedFinish: Date;
  };
  folder: {
    // Changed from folders to folder
    _id: string;
    tipe: string;
    ukuran: string;
    description: string;
    workingDescription: string;
    stepChecklist: string[];
    driveLink?: string;
    status?: string;
    assignee?: string;
    assigneeName?: string;
    kodeOrder: string;
  }; // Changed from array to single object
  uploadDate: string;
  status: string;
}

interface Row {
  entry: Order;
  progress: FolderProgress;
  due: DueInfo | null;
}

type QuickFilter = "all" | "open" | "late" | "today" | "week";

const QUICK_FILTERS: { key: QuickFilter; label: string; test: (r: Row) => boolean }[] = [
  { key: "all", label: "Semua", test: () => true },
  { key: "open", label: "Belum selesai", test: (r) => !r.progress.finished },
  { key: "late", label: "Terlambat", test: (r) => !r.progress.finished && !!r.due && r.due.diff < 0 },
  { key: "today", label: "Deadline hari ini", test: (r) => !r.progress.finished && r.due?.diff === 0 },
  {
    key: "week",
    label: "7 hari ke depan",
    test: (r) => !r.progress.finished && !!r.due && r.due.diff >= 0 && r.due.diff <= 7
  }
];

const columnHelper = createColumnHelper<Row>();

const columns = [
  columnHelper.accessor((r) => new Date(r.entry.order.uploadDate).getTime(), {
    id: "upload",
    sortDescFirst: true
  }),
  columnHelper.accessor((r) => r.entry.order.sender?.name ?? "", { id: "sender" }),
  columnHelper.accessor((r) => jenisLabel(r.entry.folder), { id: "jenis" }),
  columnHelper.accessor((r) => r.entry.folder.kodeOrder ?? "", { id: "kode" }),
  columnHelper.accessor((r) => r.entry.folder.description ?? "", { id: "description" }),
  columnHelper.accessor((r) => r.due?.date.getTime(), {
    id: "due",
    sortUndefined: "last",
    sortDescFirst: false
  }),
  // How far along the folder is; ties broken by when the last step was ticked.
  columnHelper.accessor((r) => r.progress.ratio, {
    id: "status",
    sortDescFirst: false,
    sortingFn: (a, b) =>
      a.original.progress.ratio - b.original.progress.ratio ||
      (a.original.progress.currentAt?.getTime() ?? 0) - (b.original.progress.currentAt?.getTime() ?? 0)
  })
];

export function WorkerSemuaPesanan(props: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sorting, setSorting] = useState<SortingState>([{ id: "upload", desc: true }]);

  const processTypes = {
    "Cetak Foto": [
      "Admin - Terima",
      "Bojes - Cetak",
      "Bojes - Laminating",
      "Bojes - selesai"
    ],
    "Kolase": [
      "Admin - Terima",
      "Bojes - Cetak",
      "Bojes - Laminating",
      "Bojes - di Urut",
      "Bojes - Naik ke atas",
      "Bojes - Selesai"
    ],
    "Magazine": [
      "Admin - Terima",
      "Bojes - Kirim ke Azis",
      "Azis - Atur Warna & Potong2x",
      "Azis - Proses Cetak",
      "Azis - di Urut",
      "Azis - Naik ke atas",
      "Azis - Selesai"
    ],
    "Semi Magazine": [
      "Admin - Terima",
      "Admin - Edit",
      "Admin - Set warna",
      "Admin - Cetak",
      "Admin - Urut",
      "Admin - Kasih Putra",
      "Admin - Selesai"
    ],
    "Bingkai": [
      "Admin - Terima",
      "Bojes - Cetak",
      "Bojes - Laminating",
      "Admin - Kode Bingkai",
      "Admin - Naik ke atas",
      "Admin - Selesai"
    ],
    "Flash Disk": ["Admin - Terima", "Bojes - Grafir", "Bojes - Selesai"],
    "Other": [
      "Admin - Terima",
      "Bojes - Cetak",
      "Bojes - di Finishing",
      "Bojes - Selesai"
    ]
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(
        `https://jovanalbum-system-backend.onrender.com/order/user/${props.userId}`
      );
      const data = await res.json();
      const orders = Array.isArray(data) ? data : [data];

      // Process each order's folders to assign checklists
      for (const order of orders) {
        if (
          !order.folder.stepChecklist ||
          order.folder.stepChecklist.length === 0
        ) {
          const checklistForType =
            processTypes[order.folder.tipe as keyof typeof processTypes] ||
            processTypes["Other"];
          await assignChecklistToFolder(order.folder._id, checklistForType);
        }
      }

      setOrders(orders);
      setError(null);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        "https://jovanalbum-system-backend.onrender.com/user"
      );
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    }
  };

  const assignChecklistToFolder = async (
    folderId: string,
    checklist: string[]
  ) => {
    try {
      const response = await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/assign/checklist",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            folderId,
            checklist
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign checklist");
      }

      return await response.json();
    } catch (error) {
      console.error("Error assigning checklist:", error);
      throw error;
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      await Promise.all([fetchOrders(), fetchUsers()]);
      setIsLoading(false);
    };
    initialFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    const intervalId = setInterval(async () => {
      await fetchOrders();
    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Precompute progress and deadline once per refresh.
  const rows = useMemo<Row[]>(() => {
    const now = new Date();
    return orders
      .filter((o) => o?.order && o?.folder)
      .map((entry) => ({
        entry,
        progress: folderProgress(entry.folder, entry.order.uploadDate),
        due: dueInfo(entry.order.estimatedFinish, now)
      }));
  }, [orders]);

  const chips = useMemo(
    () => QUICK_FILTERS.map((f) => ({ key: f.key, label: f.label, count: rows.filter(f.test).length })),
    [rows]
  );

  const visibleRows = useMemo(() => {
    const test = QUICK_FILTERS.find((f) => f.key === quickFilter)!.test;
    const term = searchTerm.trim().toLowerCase();
    return rows.filter(
      (r) =>
        test(r) &&
        (!term ||
          r.entry.order?.sender?.name?.toLowerCase().includes(term) ||
          r.entry.order?.sender?.whatsapp?.includes(term) ||
          r.entry.folder?.kodeOrder?.toLowerCase().includes(term))
    );
  }, [rows, quickFilter, searchTerm]);

  const table = useReactTable({
    data: visibleRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => r.entry.folder._id
  });

  if (isLoading) {
    return <div className="p-6">Loading orders...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  const col = (id: string) => table.getColumn(id);

  return (
    <div className="p-4 pt-16 sm:p-6 lg:pt-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Semua Pesanan ({orders.length} folder)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Klik judul kolom untuk mengurutkan. Klik lagi untuk membalik arah.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-5 h-5 text-gray-500" aria-hidden="true" />
          <Input
            aria-label="Cari pesanan"
            placeholder="Cari nama, kode, atau WhatsApp…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72"
          />
        </div>
      </div>

      <div className="mb-4">
        <FilterChips chips={chips} value={quickFilter} onChange={setQuickFilter} />
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10">No orders found</div>
      ) : (
        <div className="border rounded-lg">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="bg-gray-300 hover:bg-gray-300">
                <SortableHeader column={col("upload")}>Upload Date</SortableHeader>
                <SortableHeader column={col("sender")}>Sender Name</SortableHeader>
                <SortableHeader column={col("jenis")}>Jenis</SortableHeader>
                <SortableHeader column={col("kode")}>Kode</SortableHeader>
                <SortableHeader column={col("description")}>Description</SortableHeader>
                <SortableHeader column={col("due")}>Estimasi Selesai</SortableHeader>
                <SortableHeader column={col("status")} className="min-w-[210px]">Status</SortableHeader>
                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                    Tidak ada pesanan yang cocok dengan filter ini.
                  </TableCell>
                </TableRow>
              )}
              {table.getRowModel().rows.map((tableRow, index) => {
                const { entry: order, progress, due } = tableRow.original;
                return (
                  <TableRow
                    key={tableRow.id}
                    className={`border-b border-gray-300 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <TableCell className="whitespace-nowrap">
                      {new Date(order.order.uploadDate).toLocaleDateString(
                        "id-ID"
                      )}
                    </TableCell>
                    <TableCell>{order.order.sender?.name || "N/A"}</TableCell>
                    <TableCell className="whitespace-nowrap">{jenisLabel(order.folder)}</TableCell>
                    <TableCell className="max-w-[240px]">{order.folder.kodeOrder}</TableCell>
                    <TableCell className="max-w-xs relative">
                      {(() => {
                        const content =
                          [
                            order.folder?.description?.split("|")[0],
                            order.folder?.workingDescription
                          ]
                            .filter(Boolean)
                            .join("\n") || "N/A";
                        const isExpanded = expandedFolderId === order.folder._id;
                        const hasMultipleLines = content.includes("\n");
                        const expandable = hasMultipleLines || content.length > 50;

                        if (content === "N/A") {
                          return "N/A";
                        }

                        return (
                          <div
                            className={`${
                              isExpanded ? "whitespace-pre-wrap" : "truncate"
                            } ${expandable ? "cursor-pointer hover:text-gray-600" : ""}`}
                            onClick={() => {
                              if (expandable) {
                                setExpandedFolderId(isExpanded ? null : order.folder._id);
                              }
                            }}
                          >
                            {content}
                            {expandable && (
                              <button
                                className="ml-2 inline-flex items-center"
                                aria-label={isExpanded ? "Tutup deskripsi" : "Buka deskripsi"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedFolderId(isExpanded ? null : order.folder._id);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {order.order.estimatedFinish ? (
                        <div className="flex flex-col items-start gap-1">
                          <span>
                            {new Date(order.order.estimatedFinish).toLocaleDateString("id-ID")}
                          </span>
                          {!progress.finished && <DueBadge due={due} className="text-[11px]" />}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${progressTone(progress)}`}
                        >
                          {progress.current ?? "Pending"}
                        </span>
                        {progress.total > 0 && (
                          <span className="text-[11px] text-gray-600 whitespace-nowrap">
                            Tahap {progress.doneCount}/{progress.total}
                            {progress.currentAt &&
                              ` · ${format(progress.currentAt, "d MMM HH:mm", { locale: localeId })}`}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <WorkerConfirmationBox
                          button={
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 hover:bg-green-100 text-green-600"
                            >
                              Accept
                            </Button>
                          }
                          type={
                            order.folder.tipe as
                              | "Cetak Foto"
                              | "Kolase"
                              | "Magazine"
                              | "Semi Magazine"
                              | "Bingkai"
                              | "Flash Disk"
                              | "Other"
                              | undefined
                          }
                          users={users}
                          order={order}
                        />

                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default WorkerSemuaPesanan;
