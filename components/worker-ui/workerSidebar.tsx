"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Home, ShoppingBag, Settings, MenuIcon, X } from "lucide-react";
import { Avatar } from "@radix-ui/react-avatar";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";

export function WorkerSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { userId } = useAuth();
  const { user } = useUser();

  //extract the userId from the session

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          console.log(userId);
        }}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white hover:bg-gray-100 lg:hidden"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-screen bg-white border-r border-gray-200 w-64
        transition-transform duration-300 ease-in-out z-40
        lg:translate-x-0 lg:static
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-start h-20 border-b border-gray-200 mb-3 ml-4 gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
            <Avatar className="flex items-center">
              <UserButton />
            </Avatar>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">{user?.username}</h2>
            <span className="text-xs">Jovan Album Employee</span>
          </div>
        </div>

        <nav className="space-y-1">
          <Link
            href="/user/dashboard"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <Home className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link
            href="/user/semua-pesanan"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <ShoppingBag className="w-5 h-5 mr-3" />
            Semua Pesanan
          </Link>
          <Link
            href="/user/settings"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Link>
        </nav>
      </div>
    </>
  );
}

export default WorkerSidebar;
