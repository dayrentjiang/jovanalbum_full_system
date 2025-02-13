"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Home,
  ShoppingBag,
  // Settings,
  MenuIcon,
  X,
  Users,
  ChevronDown,
  ChevronRight,
  FileClock
} from "lucide-react";
import { Avatar } from "@radix-ui/react-avatar";
import { UserButton } from "@clerk/nextjs";
import { useEffect } from "react";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isKaryawanOpen, setIsKaryawanOpen] = useState(false);
  const [users, setUsers] = useState<{ userId: string; firstName: string }[]>(
    []
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          "https://jovanalbum-system-backend.onrender.com/user"
        );
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);
  // This would come from your database - example data for now

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          lg:translate-x-0 lg:static overflow-y-auto
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

          {/* Karyawan Section */}
          <div>
            <button
              onClick={() => setIsKaryawanOpen(!isKaryawanOpen)}
              className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3" />
                Karyawan
              </div>
              {isKaryawanOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Karyawan List */}
            {isKaryawanOpen && (
              <div className="pl-12 space-y-1">
                {users.map((karyawan) => (
                  <Link
                    key={karyawan.userId}
                    href={`/admin/karyawan/${karyawan.userId}`}
                    className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    {karyawan.firstName}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/admin/history"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <FileClock className="w-5 h-5 mr-3" />
            History
          </Link>
        </nav>
      </div>
    </>
  );
}

export default Sidebar;
