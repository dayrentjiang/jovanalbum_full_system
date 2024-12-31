"use client";

import { useState } from "react";
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

// Updated sample data for orders
const orders = [
  {
    id: "ORD001",
    senderName: "John Doe",
    whatsappNumber: "+62123456789",
    folders: [
      { name: "Folder A", type: "Type A" },
      { name: "Folder B", type: "Type B" }
    ],
    orderDate: "2023-06-01",
    status: "Pending"
  },
  {
    id: "ORD002",
    senderName: "Jane Smith",
    whatsappNumber: "+62987654321",
    folders: [{ name: "Folder C", type: "Type A" }],
    orderDate: "2023-06-02",
    status: "Completed"
  },
  {
    id: "ORD003",
    senderName: "Bob Johnson",
    whatsappNumber: "+62111222333",
    folders: [
      { name: "Folder D", type: "Type C" },
      { name: "Folder E", type: "Type B" },
      { name: "Folder F", type: "Type A" }
    ],
    orderDate: "2023-06-03",
    status: "Pending"
  }
];

export function SemuaPesanan() {
  const [filter, setFilter] = useState("");
  const [filteredOrders, setFilteredOrders] = useState(orders);
  //   const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    const filtered = orders.filter((order) =>
      order.id.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

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
              <TableHead className="font-semibold">Order ID</TableHead>
              <TableHead className="font-semibold">Name of Sender</TableHead>
              <TableHead className="font-semibold">WhatsApp Number</TableHead>
              <TableHead className="font-semibold">Number of Folders</TableHead>
              <TableHead className="font-semibold">Date of Order</TableHead>
              <TableHead className="font-semibold">Order Status</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.senderName}</TableCell>
                <TableCell>{order.whatsappNumber}</TableCell>
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
                      className="w-[300px] p-0 shadow-lg"
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
                            <div className="flex items-center gap-8">
                              <span className="font-medium min-w-[80px]">
                                {folder.name}
                              </span>
                              <span className="text-gray-600">
                                {folder.type}
                              </span>
                            </div>
                            <button className="text-blue-600 hover:text-blue-800 text-sm">
                              Open
                            </button>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>{order.orderDate}</TableCell>
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
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Check className="h-4 w-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
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
