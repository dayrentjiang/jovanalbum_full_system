"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SemuaHistory } from "@/components/admin-ui/semua-history";
import { BACKEND_URL } from "@/lib/config";

function OrdersHistoryPageContent() {
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
  const router = useRouter();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/history?${params.toString()}`);
  };

  const fetchData = useCallback(() => {
    setIsLoading(true);

    // Build query string from URL params
    const params = new URLSearchParams(searchParams.toString());
    // For history page, we only want history status
    if (!params.has("status")) {
      params.set("status", "history");
    }
    if (!params.has("page")) {
      params.set("page", "1");
    }
    if (!params.has("limit")) {
      params.set("limit", "50");
    }
    // Newest first across pages; the table then sorts within the page.
    if (!params.has("sortBy")) {
      params.set("sortBy", "uploadDate");
      params.set("sortOrder", "desc");
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
      <SemuaHistory
        orders={orders}
        users={users}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default function OrdersHistoryPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading history...</div>}>
      <OrdersHistoryPageContent />
    </Suspense>
  );
}
