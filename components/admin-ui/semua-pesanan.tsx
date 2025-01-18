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
import { Check, X, Edit, ChevronDown, Link } from "lucide-react";
import { format } from "date-fns";
import { ConfirmationBox } from "./confirmationBox";
import { EditBox } from "./editBox";
import { EstimatedDeliveryBox } from "./estimatedFinishBox";

interface Order {
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
  // Extract props
  const { orders, users } = props;

  // Set up state
  const [filterType, setFilterType] = useState<
    "name" | "trackingId" | "phone" | "description"
  >("name");
  const [filterValue, setFilterValue] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);

  // Normalize phone number by removing spaces, +, and -
  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/[\s+\-]/g, "").toLowerCase();
  };
  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim();
  };

  // Update filteredOrders when props.orders changes
  useEffect(() => {
    if (!filterValue) {
      setFilteredOrders(orders);
    } else {
      // If there is an active filter, reapply it to the new orders
      handleFilter(filterValue);
    }
    console.log("Orders updated");
    console.log(orders);
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

  // When changing filter type
  const handleFilterTypeChange = (value: "name" | "trackingId" | "phone") => {
    setFilterType(value);
    if (filterValue) {
      // Reapply the current filter value with the new type
      handleFilter(filterValue);
    }
  };

  const handleCompleteButton = async (order: Order) => {
    console.log("Complete button clicked");
    const statusResponse = await fetch(
      `https://jovanalbum-system-backend.onrender.com/order/complete`,
      // "http://localhost:8001/order/complete",
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

    // Send WhatsApp message
    const phoneNumber = order.sender.whatsapp
      .replace(/^0/, "62") // Convert local phone numbers to international format
      .replace(/[-+ ]/g, ""); // Remove unwanted characters

    // Create folder details message
    const folderDetailsMessage = order.folders
      .map(
        (folder, index) =>
          `Folder ${index + 1}:%0Aukuran: ${folder.ukuran}%0Adeskripsi: ${
            folder.description
          }`
      )
      .join("%0A__________________________%0A");

    // Construct the WhatsApp message without the trackingId line
    const message = `https://wa.me/${phoneNumber}?text=*PESANANMU*%20*SUDAH*%20*SELESAI*%20*!*%0A.......%0ATerima%20kasih!%20pesananmu%20atas%20nama:%20${order.sender.name}%20sudah%20selesai%20dan%20dapat%20langsung%20diambil%20di%20JovanAlbum!%0A%0A__________________________%0Arincian%20pesanan:%0A${folderDetailsMessage}%0A__________________________%0A%0A.......%0A*%20Jovan%20Album%20*`;

    // Open the WhatsApp link
    window.open(message, "_blank", "noopener,noreferrer");
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
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {/* <TableHead className="font-semibold">Tracking ID</TableHead> */}
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
            {filteredOrders
              .sort(
                (a, b) =>
                  new Date(b.uploadDate).getTime() -
                  new Date(a.uploadDate).getTime()
              )
              .map((order) => (
                <TableRow key={order._id} className="hover:bg-gray-50">
                  {/* <TableCell>
                    {order.trackingId ? order.trackingId : "Pending"}
                  </TableCell> */}
                  <TableCell>
                    {format(
                      new Date(order.uploadDate),
                      "dd-MMM-yyyy | hh:mm a"
                    )}
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
                          {order.folders.length}{" "}
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[auto] p-0 shadow-lg"
                        align="start"
                        sideOffset={5}
                        // alignOffset={}
                      >
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                          <h4 className="text-sm font-semibold">Folders</h4>
                          <p className="text-sm text-gray-500">
                            List of folders and their types
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-2">
                            {order.folders.map((folder, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between px-4 py-2 bg-white rounded-md hover:bg-gray-50 transition-colors duration-150"
                              >
                                <div className="flex flex-col flex-grow max-w-[50%]">
                                  <span className="font-medium text-gray-900">
                                    {folder.tipe
                                      ? `${folder.tipe}-${folder.ukuran}`
                                      : folder.ukuran}
                                  </span>
                                  <span className="text-gray-500 text-xs max-w-[50%]">
                                    {folder.description}
                                  </span>
                                </div>

                                <div className="flex flex-col flex-grow">
                                  <span className="text-sm text-gray-600 min-w-[40px] ml-5">
                                    {folder.kodeOrder
                                      ? folder.kodeOrder
                                      : "N/A"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-6 ml-10">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
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
                                  <span className="text-sm text-gray-600 min-w-[100px] ml-5">
                                    {folder.assigneeName || "Belum"}
                                  </span>

                                  <button
                                    onClick={() => {
                                      if (folder.driveLink) {
                                        // Open both the specific folder and main folder
                                        window.open(
                                          folder.driveLink,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                        window.open(
                                          `https://drive.google.com/drive/folders/${order.mainFolderId}`,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                      } else {
                                        // Only open main folder
                                        window.open(
                                          `https://drive.google.com/drive/folders/${order.mainFolderId}`,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                      }
                                    }}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors ml-4"
                                  >
                                    <Link size={14} className="inline" />
                                    <span>
                                      {folder.driveLink ? "Drive (2)" : "Open"}
                                    </span>
                                  </button>
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
                        const allFoldersComplete = order.folders.every(
                          (folder) =>
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
                            format(
                              new Date(order.estimatedFinish),
                              "dd-MMM-yyyy"
                            )
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
      </div>
    </div>
  );
}
