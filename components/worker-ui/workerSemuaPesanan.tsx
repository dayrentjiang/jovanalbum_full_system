"use client";

import { useEffect, useState } from "react";
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
import { Search } from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";
import WorkerConfirmationBox from "./workerConfirmationBox";

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

export function WorkerSemuaPesanan(props: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8001/order/user/${props.userId}`
        );
        const data = await res.json();
        const orders = Array.isArray(data) ? data : [data];

        console.log("Orders:", orders);

        // Process each order's folders to assign checklists
        for (const order of orders) {
          if (
            !order.folder.stepChecklist ||
            order.folder.stepChecklist.length === 0
          ) {
            // Only assign if checklist is empty
            const checklistForType =
              processTypes[order.folder.tipe as keyof typeof processTypes] ||
              processTypes["Other"];
            await assignChecklistToFolder(order.folder._id, checklistForType);
          }
        }

        setOrders(orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    // Frontend: Function to call the backend endpoint
    const assignChecklistToFolder = async (
      folderId: string,
      checklist: string[]
    ) => {
      try {
        const response = await fetch(
          "http://localhost:8001/order/assign/checklist",
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

    const fetchUser = async () => {
      try {
        const res = await fetch(
          "https://jovanalbum-system-backend.onrender.com/user"
        );
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        setError("Error fetching user");
        console.error("Error fetching user:", error);
      }
    };

    fetchData();
    fetchUser();
  }, []);

  //console.log the orders every 5 sec
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(orders);
    }, 5000);
    return () => clearInterval(interval);
  }, [orders]);

  if (isLoading) {
    return <div className="p-6">Loading orders...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  const filteredOrders = orders
    .filter(
      (order) =>
        !searchTerm ||
        order.order?.sender?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.order?.sender?.whatsapp?.includes(searchTerm)
    )
    .sort((a, b) => {
      const dateA = new Date(a.order.uploadDate).getTime();
      const dateB = new Date(b.order.uploadDate).getTime();
      return dateB - dateA; // Sort in descending order
    });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Semua Pesanan ({orders.length} orders)
        </h1>
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search by name or WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10">No orders found</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Upload Date</TableHead>
                <TableHead className="font-semibold">Sender Name</TableHead>
                {/* <TableHead className="font-semibold">WhatsApp</TableHead> */}
                <TableHead className="font-semibold">Jenis</TableHead>
                <TableHead className="font-semibold">Kode</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">
                  Estimasi Selesai
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.order._id}>
                  <TableCell>
                    {new Date(order.order.uploadDate).toLocaleDateString(
                      "id-ID"
                    )}
                  </TableCell>
                  <TableCell>{order.order.sender?.name || "N/A"}</TableCell>
                  {/* <TableCell>{order.order.sender?.whatsapp || "N/A"}</TableCell> */}
                  <TableCell>{`${order.folder?.tipe || ""} ${
                    order.folder?.ukuran || ""
                  }`}</TableCell>
                  <TableCell>{order.folder.kodeOrder}</TableCell>
                  <TableCell className="max-w-xs relative">
                    {(() => {
                      const content =
                        order.folder?.description +
                          "\n" +
                          order.folder.workingDescription || "N/A";
                      const isExpanded = expandedOrderId === order.order._id;
                      const hasMultipleLines = content?.includes("\n");

                      if (content === "N/A") {
                        return "N/A";
                      }

                      return (
                        <div
                          className={`${
                            isExpanded ? "whitespace-pre-wrap" : "truncate"
                          } ${
                            hasMultipleLines || content.length > 50
                              ? "cursor-pointer hover:text-gray-600"
                              : ""
                          }`}
                          onClick={() => {
                            if (hasMultipleLines || content.length > 50) {
                              setExpandedOrderId(
                                isExpanded ? null : order.order._id
                              );
                            }
                          }}
                        >
                          {content}
                          {(hasMultipleLines || content.length > 50) && (
                            <button
                              className="ml-2 inline-flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedOrderId(
                                  isExpanded ? null : order.order._id
                                );
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

                  <TableCell>
                    {order.order.estimatedFinish
                      ? new Date(
                          order.order.estimatedFinish
                        ).toLocaleDateString("id-ID")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        order.folder.stepChecklist?.some((step) =>
                          step.includes("(done)")
                        )
                          ? order.folder.stepChecklist[
                              order.folder.stepChecklist.length - 1
                            ].includes("(done)")
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.folder.stepChecklist?.find((step) =>
                        step.includes("(done)")
                      )
                        ? order.folder.stepChecklist
                            .filter((step) => step.includes("(done)"))
                            .pop()
                            ?.replace(" (done)", "")
                        : "Pending"}
                    </span>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default WorkerSemuaPesanan;
