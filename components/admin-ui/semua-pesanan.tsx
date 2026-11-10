"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Check, X, Edit, ChevronDown, Link } from "lucide-react";
import { format } from "date-fns";
import { ConfirmationBox } from "./confirmationBox";
import { EditBox } from "./editBox";
import { EstimatedDeliveryBox } from "./estimatedFinishBox";
import FileDownloader from "./downloader/fileDownloader";
import DownloadNotifications from "./downloader/downloadNotifications";
import { Pagination } from "./pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { FilterChips } from "@/components/ui/filter-chips";
import { DueBadge } from "@/components/dashboard/parts";
import { dueInfo, isInProduction } from "@/lib/orders";

export interface Order {
  _id: string;
  trackingId: string;
  sender: {
    name: string;
    whatsapp: string;
  };
  folders: {
    _id: string;
    tipe: string;
    ukuran: string;
    description: string;
    driveLink?: string;
    status?: string;
    assignee?: string;
    assigneeName?: string;
    orderStatusNow?: string[];
    kodeOrder: string;
    stepChecklist: string[];
    subFolderId: string;
  }[];
  mainFolderId: string;
  uploadDate: string;
  status: string;
  estimatedFinish: Date;
  workingNotes: string;
}

interface User {
  userId: string;
  firstName: string;
  LastName: string;
  Orders: Order[];
}

type FilterType = "name" | "trackingId" | "phone" | "description";
type QuickFilter = "all" | "new" | "on-process" | "complete" | "late" | "today";

const PAGE_SIZE = 50;

const STATUS_RANK: Record<string, number> = { pending: 0, new: 0, "on-process": 1, complete: 2 };

const normalizeText = (text: string | undefined) => (text ?? "").toLowerCase().trim();
const normalizePhone = (phone: string | undefined) => (phone ?? "").replace(/[\s+\-]/g, "").toLowerCase();

function matchesSearch(order: Order, type: FilterType, value: string): boolean {
  const q = normalizeText(value);
  if (!q) return true;
  switch (type) {
    case "name":
      return normalizeText(order.sender?.name).includes(q);
    case "phone":
      return normalizePhone(order.sender?.whatsapp).includes(normalizePhone(value));
    case "trackingId":
      return normalizeText(order.trackingId || "pending").includes(q);
    case "description":
      return order.folders.some((f) => normalizeText(f.description).includes(q));
  }
}

const isLate = (o: Order) => {
  const d = dueInfo(o.estimatedFinish);
  return isInProduction(o) && !!d && d.diff < 0;
};
const isDueToday = (o: Order) => isInProduction(o) && dueInfo(o.estimatedFinish)?.diff === 0;

const QUICK_FILTERS: { key: QuickFilter; label: string; test: (o: Order) => boolean }[] = [
  { key: "all", label: "Semua", test: () => true },
  { key: "new", label: "Baru", test: (o) => o.status === "new" || o.status === "pending" },
  { key: "on-process", label: "Dalam proses", test: (o) => o.status === "on-process" },
  { key: "complete", label: "Siap diambil", test: (o) => o.status === "complete" },
  { key: "late", label: "Terlambat", test: isLate },
  { key: "today", label: "Deadline hari ini", test: isDueToday }
];

const columnHelper = createColumnHelper<Order>();

const columns = [
  columnHelper.accessor((o) => new Date(o.uploadDate).getTime(), { id: "uploadDate", sortDescFirst: true }),
  columnHelper.accessor((o) => o.sender?.name ?? "", { id: "sender" }),
  columnHelper.accessor((o) => o.sender?.whatsapp ?? "", { id: "whatsapp" }),
  columnHelper.accessor((o) => o.folders.length, { id: "folders", sortDescFirst: true }),
  columnHelper.accessor((o) => STATUS_RANK[o.status] ?? 0, { id: "status", sortDescFirst: false }),
  columnHelper.accessor((o) => (o.estimatedFinish ? new Date(o.estimatedFinish).getTime() : undefined), {
    id: "estimatedFinish",
    sortUndefined: "last",
    sortDescFirst: false
  })
];

export function SemuaPesanan(props: {
  orders: Order[];
  users: User[];
  isLoading: boolean;
}) {
  const { orders, users } = props;

  const [filterType, setFilterType] = useState<FilterType>("name");
  const [filterValue, setFilterValue] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sorting, setSorting] = useState<SortingState>([{ id: "uploadDate", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE });

  const handleFilter = (value: string) => {
    setFilterValue(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleFilterTypeChange = (value: FilterType) => {
    setFilterType(value);
    setFilterValue("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleQuickFilter = (key: QuickFilter) => {
    setQuickFilter(key);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const chips = useMemo(
    () => QUICK_FILTERS.map((f) => ({ key: f.key, label: f.label, count: orders.filter(f.test).length })),
    [orders]
  );

  const visibleOrders = useMemo(() => {
    const test = QUICK_FILTERS.find((f) => f.key === quickFilter)!.test;
    return orders.filter((o) => test(o) && matchesSearch(o, filterType, filterValue));
  }, [orders, quickFilter, filterType, filterValue]);

  // TanStack's hook returns functions that the React Compiler cannot memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: visibleOrders,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    // Data refreshes every few seconds; don't jump back to page 1 each time.
    autoResetPageIndex: false,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (o) => o._id
  });

  const pageCount = Math.max(1, table.getPageCount());
  // If a refresh shrinks the list, don't leave the user on an empty page.
  useEffect(() => {
    if (pagination.pageIndex > pageCount - 1) {
      setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }));
    }
  }, [pageCount, pagination.pageIndex]);

  const handlePageChange = (page: number) => {
    setPagination((p) => ({ ...p, pageIndex: page - 1 }));
  };

  const col = (id: string) => table.getColumn(id);

  const handleCompleteButton = async (order: Order) => {
    console.log("Complete button clicked");
    const statusResponse = await fetch(
      `https://jovanalbum-system-backend.onrender.com/order/complete`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ _id: order._id })
      }
    );
    const response = await statusResponse.json();
    console.log(response);

    try {
      const phoneNumber = order.sender.whatsapp
        .replace(/^0/, "62")
        .replace(/\D/g, "");
      const senderName = order.sender.name;

      const foldersDetails = order.folders
        .map((folder, index) => {
          const folderNumber = index + 1;
          return `Folder ${folderNumber}:
  ${folder.tipe ? `tipe: ${folder.tipe}` : ""}
  ${folder.kodeOrder ? `kode order: ${folder.kodeOrder}` : ""} 
  ukuran: ${folder.ukuran}
  deskripsi: ${folder.description} ||`;
        })
        .join("\n\n");

      const message = `*Terima kasih atas kepercayaan Anda kepada kami!*🙏🏻🙏🏻
Pesanan Anda telah selesai dan siap diambil / dikirim. 
.......
  
*Rincian Pesanan:*
Nama: ${senderName}
  
${foldersDetails}
  
.......
*Semoga Banyak Rejeki ta....Amin..*
🥰👍🤭
JOVAN ALBUM
#SahabatFotografer`;

      const encodedMessage = encodeURIComponent(message);
      window.open(
        `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
    }
  };

  const statusClassMap: { [key: string]: string } = {
    "on-process": "bg-yellow-100 text-yellow-800",
    "complete": "bg-green-100 text-green-800"
  };

  return (
    <div className="p-4 pt-16 sm:p-6 lg:pt-6">
      <h1 className="text-2xl font-semibold">
        Semua Pesanan <span className="font-medium text-gray-600">({orders.length} pesanan)</span>
      </h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">
        Klik judul kolom untuk mengurutkan. Klik lagi untuk membalik arah.
      </p>

      <div className="flex flex-wrap gap-4 mb-4">
        <Select value={filterType} onValueChange={handleFilterTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by..." />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="phone">Phone Number</SelectItem>
            <SelectItem value="trackingId">Tracking ID</SelectItem>
            <SelectItem value="description">Description</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Input
            type="text"
            placeholder={`Filter by ${
              filterType === "name"
                ? "sender name"
                : filterType === "trackingId"
                ? "tracking ID"
                : filterType === "phone"
                ? "phone number"
                : "description"
            }`}
            value={filterValue}
            onChange={(e) => handleFilter(e.target.value)}
            className="w-full border-gray-300 pr-8"
          />
          {filterValue && (
            <button
              onClick={() => {
                setFilterValue("");
                handleFilter("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label="Clear filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <FilterChips chips={chips} value={quickFilter} onChange={handleQuickFilter} />
      </div>

      <div className="border rounded-lg">
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <SortableHeader column={col("uploadDate")}>Date of Order</SortableHeader>
              <SortableHeader column={col("sender")}>Name of Sender</SortableHeader>
              <SortableHeader column={col("whatsapp")}>WhatsApp Number</SortableHeader>
              <SortableHeader column={col("folders")}>Number of Folders</SortableHeader>
              <SortableHeader column={col("status")}>Order Status</SortableHeader>
              <SortableHeader column={col("estimatedFinish")}>Estimated Delivery</SortableHeader>
              <TableHead className="font-semibold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                  {props.isLoading && orders.length === 0
                    ? "Memuat pesanan…"
                    : "Tidak ada pesanan yang cocok dengan filter ini."}
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows.map(({ original: order }) => (
              <TableRow key={order._id} className="hover:bg-gray-50">
                {/* <TableCell>
                    {order.trackingId ? order.trackingId : "Pending"}
                  </TableCell> */}
                <TableCell>
                  {format(new Date(order.uploadDate), "dd-MMM-yyyy | hh:mm a")}
                </TableCell>
                <TableCell>{order.sender.name}</TableCell>
                <TableCell>{order.sender.whatsapp}</TableCell>
                <TableCell className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-16 border-gray-300"
                      >
                        {order.folders.length}
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full max-w-6xl p-6 shadow-lg bg-white rounded-lg"
                      align="center"
                      side="top"
                      sideOffset={20}
                    >
                      <div className="border-b border-gray-200 pb-3">
                        <h4 className="text-sm font-semibold">Folders</h4>
                        <p className="text-sm text-gray-500">
                          List of folders and their types
                        </p>
                      </div>
                      <div className="max-h-[600px] overflow-y-auto mt-4">
                        <div className="space-y-6">
                          {order.folders.map((folder, index) => (
                            <div
                              key={index}
                              className="p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-gray-900 block truncate mr-10">
                                    {folder.tipe
                                      ? `${folder.tipe} - ${folder.ukuran}`
                                      : folder.ukuran}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {folder.kodeOrder || "N/A"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      folder.stepChecklist?.some((step) =>
                                        step.includes("(done)")
                                      )
                                        ? folder.stepChecklist[
                                            folder.stepChecklist.length - 1
                                          ].includes("(done)")
                                          ? "bg-green-100 text-green-800"
                                          : "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {folder.stepChecklist?.find((step) =>
                                      step.includes("(done)")
                                    )
                                      ? folder.stepChecklist
                                          .filter((step) =>
                                            step.includes("(done)")
                                          )
                                          .pop()
                                          ?.replace(" (done)", "")
                                      : "Pending"}
                                  </span>
                                  <span className="text-sm text-gray-600 min-w-[100px]">
                                    {folder.assigneeName || "Belum"}
                                  </span>
                                  <button
                                    onClick={() => {
                                      if (folder.driveLink) {
                                        window.open(
                                          folder.driveLink,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                        window.open(
                                          `https://drive.google.com/drive/folders/${
                                            folder.subFolderId
                                              ? folder.subFolderId
                                              : order.mainFolderId
                                          }`,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                      } else {
                                        window.open(
                                          `https://drive.google.com/drive/folders/${
                                            folder.subFolderId
                                              ? folder.subFolderId
                                              : order.mainFolderId
                                          }`,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                      }
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors ml-4"
                                  >
                                    <Link size={14} className="inline" />
                                    <span>
                                      {folder.driveLink ? "Drive (2)" : "Open"}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      console.log("test");
                                    }}
                                  >
                                    {folder.driveLink ? (
                                      <FileDownloader
                                        fileId={
                                          folder.driveLink
                                            ?.split("/")
                                            .pop()
                                            ?.split("?")[0] ?? ""
                                        }
                                        folderName={
                                          order.sender.name +
                                          "_" +
                                          folder.tipe +
                                          "_" +
                                          folder.ukuran +
                                          "_" +
                                          folder.kodeOrder
                                        }
                                        descFolderId={folder.subFolderId}
                                      />
                                    ) : (
                                      <FileDownloader
                                        fileId={
                                          folder.subFolderId
                                            ?.split("/")
                                            .pop() ?? ""
                                        }
                                        folderName={
                                          order.sender.name +
                                          "_" +
                                          folder.tipe +
                                          "_" +
                                          folder.ukuran +
                                          "_" +
                                          folder.kodeOrder
                                        }
                                      />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="mt-3 p-3 bg-white border border-gray-300 rounded-md">
                                <h5 className="text-gray-700 font-medium text-sm">
                                  Description
                                </h5>
                                <p className="text-gray-600 text-sm whitespace-normal break-words">
                                  {folder.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusClassMap[order.status] ||
                        "bg-blue-200 text-blue-800" // Fallback for "new"
                      }`}
                    >
                      {order.status}
                    </span>
                    {(() => {
                      const allFoldersComplete = order.folders.every((folder) =>
                        folder.stepChecklist
                          ? folder.stepChecklist[
                              folder.stepChecklist.length - 1
                            ]
                              ?.toLowerCase()
                              .includes("selesai (done)")
                          : null
                      );

                      return (
                        <>
                          {allFoldersComplete &&
                            order.status !== "complete" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 hover:bg-green-100 text-green-600"
                                onClick={() => handleCompleteButton(order)}
                              >
                                Complete
                              </Button>
                            )}
                        </>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell>
                  <EstimatedDeliveryBox
                    orderId={order._id}
                    button={
                      <button className="p-1 hover:bg-gray-100 rounded text-blue-800">
                        {order.estimatedFinish ? (
                          format(new Date(order.estimatedFinish), "dd-MMM-yyyy")
                        ) : (
                          <p className="text-gray-800">Set Delivery Date</p>
                        )}
                      </button>
                    }
                  />
                  {isInProduction(order) && (
                    <DueBadge due={dueInfo(order.estimatedFinish)} className="ml-1 text-[11px]" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {order.status === "new" ? (
                      <div>
                        <ConfirmationBox
                          button={
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Check className="h-4 w-4 text-gray-600" />
                            </button>
                          }
                          order={[order]}
                          description={
                            "Select a worker and add a description. Click send when you're done."
                          }
                          text={"Terima"}
                          buttonText={"kirim"}
                          users={users}
                        />
                      </div>
                    ) : null}

                    {order.status === "complete" ? (
                      <div>
                        <ConfirmationBox
                          button={
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Check className="h-4 w-4 text-green-800" />
                            </button>
                          }
                          order={[order]}
                          description="Are you sure you want to finish this order?"
                          text={"Finish"}
                          buttonText="Finish"
                          users={users}
                        />
                      </div>
                    ) : null}

                    <div>
                      <ConfirmationBox
                        button={
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <X className="h-4 w-4 text-gray-600" />
                          </button>
                        }
                        order={[order]}
                        description="Are you sure you want to reject this order?"
                        text={"Reject"}
                        buttonText="Reject"
                        users={users}
                      />
                    </div>

                    <div>
                      <EditBox
                        order={[order]}
                        button={
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit className="h-4 w-4 text-gray-600" />
                          </button>
                        }
                        users={users}
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DownloadNotifications />
      </div>

      <Pagination
        currentPage={pagination.pageIndex + 1}
        totalPages={pageCount}
        onPageChange={handlePageChange}
      />
      <p className="mt-2 text-center text-xs text-gray-600">
        Menampilkan {table.getRowModel().rows.length} dari {visibleOrders.length} pesanan
      </p>
    </div>
  );
}
