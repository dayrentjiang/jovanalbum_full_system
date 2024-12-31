import Link from "next/link";
import { Home, ShoppingBag, Settings } from "lucide-react";
import { Avatar } from "@radix-ui/react-avatar";
import { UserButton } from "@clerk/nextjs";

export function Sidebar() {
  return (
    <div className="w-64 h-screen border-r border-gray-200 bg-white">
      <div className="flex items-center justify-start h-20 border-b border-gray-200 mb-3 ml-4 gap-4">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
          <Avatar className="flex items-center">
            <UserButton />
          </Avatar>
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold">Admin</h2>
          <span className="text-xs">Jovan Album Admin</span>
        </div>
      </div>
      <nav className="space-y-1">
        <Link
          href="/admin/dashboard"
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          <Home className="w-5 h-5 mr-3" />
          Dashboard
        </Link>
        <Link
          href="/admin/semua-pesanan"
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          <ShoppingBag className="w-5 h-5 mr-3" />
          Semua Pesanan
        </Link>
        <Link
          href="/admin/settings"
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Link>
      </nav>
    </div>
  );
}
