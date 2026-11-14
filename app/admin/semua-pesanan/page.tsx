"use client";

import { useEffect, useState, useCallback } from "react";
import { SemuaPesanan, type Order } from "@/components/admin-ui/semua-pesanan";
import { fetchAllOrders } from "@/lib/api";
import { useWorkers } from "@/hooks/use-workers";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const users = useWorkers();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // All active orders are loaded at once (a few hundred) so every column can
  // be sorted and filtered in the browser. Finished orders live in History.
  const fetchData = useCallback(async () => {
    try {
      const data = await fetchAllOrders();
      setOrders(data as unknown as Order[]);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Error fetching orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Set interval for auto-refresh
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  if (error && orders.length === 0) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div>
      <SemuaPesanan orders={orders} users={users} isLoading={isLoading} />
    </div>
  );
}
