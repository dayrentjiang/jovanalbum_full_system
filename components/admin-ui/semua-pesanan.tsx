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
import { Check, X, Edit, ChevronDown, Link, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ConfirmationBox } from "./confirmationBox";
import { EditBox } from "./editBox";
import { EstimatedDeliveryBox } from "./estimatedFinishBox";
import FileDownloader from "./downloader/fileDownloader";
import DownloadNotifications from "./downloader/downloadNotifications";

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

export function SemuaPesanan(props: { orders: Order[]; users: User[] }) {
  const { orders, users } = props;
  const [filterType, setFilterType] = useState<
    "name" | "trackingId" | "phone" | "description"
  >("name");
  const [filterValue, setFilterValue] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);
  const [sortByEstimatedDelivery, setSortByEstimatedDelivery] = useState(false);

  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/[\s+\-]/g, "").toLowerCase();
  };

  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim();
  };

  useEffect(() => {
    if (!filterValue) {
      setFilteredOrders(orders);
    } else {
      handleFilter(filterValue);
    }
  }, [orders]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    const normalizedValue = normalizeText(value);

    const filtered = orders.filter((order) => {
      switch (filterType) {
        case "trackingId":
          const trackingId = order.trackingId
            ? normalizeText(order.trackingId)
            : "pending";
          return trackingId.includes(normalizedValue);
        case "name":
          const name = normalizeText(order.sender.name);
          return name.includes(normalizedValue);
        case "phone":
          const phone = normalizePhoneNumber(order.sender.whatsapp);
          const searchPhone = normalizePhoneNumber(value);
          return phone.includes(searchPhone);
        case "description":
          const description = normalizeText(order.folders[0].description);
          return description.includes(normalizedValue);
        default:
          return false;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleFilterTypeChange = (value: "name" | "trackingId" | "phone") => {
    setFilterType(value);
    if (filterValue) {
      handleFilter(filterValue);
    }
  };

  const sortOrders = (ordersToSort: Order[]) => {
    if (sortByEstimatedDelivery) {
      return [...ordersToSort].sort((a, b) => {
        // If neither has estimatedFinish, sort by uploadDate
        if (!a.estimatedFinish && !b.estimatedFinish) {
          return (
            new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
          );
        }
        // If only one has estimatedFinish, put the one without at the end
        if (!a.estimatedFinish) return 1;
        if (!b.estimatedFinish) return -1;
        // If both have estimatedFinish, sort by that date
        return (
          new Date(a.estimatedFinish).getTime() -
          new Date(b.estimatedFinish).getTime()
        );
      });
    } else {
      return [...ordersToSort].sort(
        (a, b) =>
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
    }
  };

  const toggleSort = () => {
    setSortByEstimatedDelivery(!sortByEstimatedDelivery);
  };

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

      const message = `
      ------------------------------------
      PESANANMU SUDAH *SELESAI* *!*
  ------------------------------------
  Terima kasih! pesananmu atas nama: ${senderName} sudah selesai dan dapat langsung diambil di JovanAlbum!
  
  __________________________
  rincian pesanan:
  
  ${foldersDetails}
  __________________________
  
  .......
  * Jovan Album *`;

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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Semua Pesanan</h1>

      <div className="flex gap-4 mb-6">
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
          className="max-w-sm border-gray-300"
        />

        <Button
          variant="outline"
          onClick={toggleSort}
          className="ml-auto flex items-center gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortByEstimatedDelivery
            ? "Sort by Upload Date"
            : "Sort by Delivery Date"}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Date of Order</TableHead>
              <TableHead className="font-semibold">Name of Sender</TableHead>
              <TableHead className="font-semibold">WhatsApp Number</TableHead>
              <TableHead className="font-semibold">Number of Folders</TableHead>
              <TableHead className="font-semibold">Order Status</TableHead>
              <TableHead className="font-semibold">
                Estimated Delivery
              </TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortOrders(filteredOrders).map((order) => (
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
    </div>
  );
}
