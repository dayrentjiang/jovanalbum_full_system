"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SemuaPesanan } from "@/components/admin-ui/semua-pesanan";
import { BACKEND_URL } from "@/lib/config";

function OrdersPageContent() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 50,
  });

  const searchParams = useSearchParams();

  const fetchData = useCallback(() => {
    setIsLoading(true);

    // Build query string from URL params
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("status")) {
      params.set("status", "pending,new,on-process,complete");
    }
    if (!params.has("page")) {
      params.set("page", "1");
    }
    if (!params.has("limit")) {
      params.set("limit", "50");
    }

    fetch(`${BACKEND_URL}/order/paginated?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.data);
          setPagination(data.pagination);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching orders:", error);
        setError("Error fetching orders");
        setIsLoading(false);
      });
  }, [searchParams]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/user`);
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        setError("Error fetching user");
        console.error("Error fetching user:", error);
      }
    };

    fetchData();
    fetchUser();

    // Set interval for auto-refresh
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div>
      <SemuaPesanan
        orders={orders}
        users={users}
        pagination={pagination}
        isLoading={isLoading}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading orders...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
