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
import { Check, X, Edit, ChevronDown } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ConfirmationBox } from "./confirmationBox";

interface Order {
  _id: string;
  trackingId: string;
  sender: {
    name: string;
    whatsapp: string;
  };
  folders: {
    ukuran: string;
    description: string;
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
  const [filter, setFilter] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);

  // Update filteredOrders when props.orders changes
  useEffect(() => {
    setFilteredOrders(orders);
  }, [orders]);

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);

    // Filter orders with null check for trackingId
    const filtered = orders.filter((order) => {
      const searchTerm = value.toLowerCase();
      const trackingId = order.trackingId
        ? order.trackingId.toLowerCase()
        : "pending";

      return trackingId.includes(searchTerm);
    });

    setFilteredOrders(filtered);
  };

  //the function to handle button
  const handleSend = (order: Order) => {};
  const handleReject = (order: Order) => {};

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Semua Pesanan</h1>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Filter by Order ID"
          value={filter}
          onChange={handleFilter}
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
                                  {folder.ukuran}
                                </span>
                                <span className="text-gray-600 text-xs">
                                  {folder.description}
                                </span>
                              </div>
                              <button
                                className="text-blue-600 hover:text-blue-800 text-sm ml-7"
                                onClick={() =>
                                  window.open(
                                    `https://drive.google.com/drive/folders/${order.mainFolderId}`,
                                    "_blank"
                                  )
                                }
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
                      order.status === "Pending"
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
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              // onClick={() => handleOnClickTerima(order)}
                            >
                              <Check className="h-4 w-4 text-gray-600" />
                            </button>
                          }
                          order={order}
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
                          order={order}
                          description="Are you sure you want to reject this order?"
                          text={"Reject"}
                          buttonText="Reject"
                        />
                      </div>

                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
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
