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
import { Check, X, Edit, ChevronDown } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ConfirmationBox } from "./confirmationBox";
import { EditBox } from "./editBox";

interface Order {
  _id: string;
  trackingId: string;
  sender: {
    name: string;
    whatsapp: string;
  };
  folders: {
    tipe: string;
    ukuran: string;
    description: string;
    driveLink?: string;
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
  Orders: [];
}

export function SemuaPesanan(props: { orders: Order[]; users: User[] }) {
  // Extract props
  const { orders, users } = props;

  // Set up state
  const [filterType, setFilterType] = useState<"name" | "trackingId" | "phone">(
    "name"
  );
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
          </SelectContent>
        </Select>

        <Input
          type="text"
          placeholder={`Filter by ${
            filterType === "name"
              ? "sender name"
              : filterType === "trackingId"
              ? "tracking ID"
              : "phone number"
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
              <TableHead className="font-semibold">Tracking ID</TableHead>
              <TableHead className="font-semibold">Name of Sender</TableHead>
              <TableHead className="font-semibold">WhatsApp Number</TableHead>
              <TableHead className="font-semibold">Number of Folders</TableHead>
              <TableHead className="font-semibold">Date of Order</TableHead>
              <TableHead className="font-semibold">Order Status</TableHead>
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
                  <TableCell>
                    {order.trackingId ? order.trackingId : "Pending"}
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
                      >
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                          <h4 className="text-sm font-semibold">Folders</h4>
                          <p className="text-sm text-gray-500">
                            List of folders and their types
                          </p>
                        </div>
                        <div className="p-2 bg-gray-50">
                          {order.folders.map((folder, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between px-2 py-1.5"
                            >
                              <div className="flex flex-col">
                                <span className="min-w-auto">
                                  {folder.tipe
                                    ? folder.tipe + "-" + folder.ukuran
                                    : folder.ukuran}
                                </span>
                                <span className="text-gray-600 text-xs">
                                  {folder.description}
                                </span>
                              </div>
                              <button
                                className="text-blue-600 hover:text-blue-800 text-sm ml-7"
                                onClick={() => {
                                  const driveLink = folder.driveLink
                                    ? folder.driveLink
                                    : "https://drive.google.com/drive/folders/" +
                                      order.mainFolderId;

                                  // Open the link in a new tab
                                  window.open(driveLink, "_blank");
                                }}
                              >
                                Open
                              </button>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    {format(
                      new Date(order.uploadDate),
                      "dd-MMM-yyyy | hh:mm a"
                    )}
                    {" | "}
                    {formatDistanceToNow(new Date(order.uploadDate), {
                      addSuffix: true
                    })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${
                      order.status === "on-process"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
