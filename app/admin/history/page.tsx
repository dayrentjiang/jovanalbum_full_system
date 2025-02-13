"use client";

import { useEffect, useState } from "react";
import { SemuaHistory } from "@/components/admin-ui/semua-history";
// import { SemuaPesanan } from "@/components/admin-ui/semua-pesanan";

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = () => {
      fetch("https://jovanalbum-system-backend.onrender.com/order/get")
        // fetch("http://localhost:8001/order/get")
        .then((res) => res.json())
        .then((data) => {
          // Filter orders to display only pending ones
          const pendingOrders = data.filter(
            (order: { status: string }) => order.status === "history"
          );
          setOrders(pendingOrders);
        })
        .catch((error) => {
          console.error("Error fetching orders:", error);
        });
    };

    const fetchUser = async () => {
      try {
        const res = await fetch(
          "https://jovanalbum-system-backend.onrender.com/user"
        );
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        setError("Error fetching user");
        console.error("Error fetching user:", error);
      }
    };
    fetchData();
    fetchUser();

    //set interval
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [orders]);

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div>
      <SemuaHistory orders={orders} users={users} />
    </div>
  );
}
