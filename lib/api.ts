import { BACKEND_URL } from "./config";
import type { OrderRecord, WorkerEntry } from "./orders";

export const ACTIVE_STATUSES = "pending,new,on-process,complete";

interface PaginatedResponse {
  success: boolean;
  data: OrderRecord[];
  pagination: { currentPage: number; totalPages: number; totalCount: number; pageSize: number };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${url}`);
  return res.json();
}

/**
 * Every order with the given statuses. Active orders are a few hundred, so
 * this is one request; it follows extra pages if there are ever more.
 */
export async function fetchAllOrders(statuses: string = ACTIVE_STATUSES, pageSize = 1000): Promise<OrderRecord[]> {
  const url = (page: number) =>
    `${BACKEND_URL}/order/paginated?status=${statuses}&page=${page}&limit=${pageSize}`;
  const first = await getJson<PaginatedResponse>(url(1));
  if (!first.success) throw new Error("Backend returned success: false");
  const orders = [...first.data];
  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const next = await getJson<PaginatedResponse>(url(page));
    orders.push(...next.data);
  }
  return orders;
}

/** The most recently uploaded finished orders (history grows forever, so it is capped). */
export async function fetchRecentHistory(limit: number): Promise<OrderRecord[]> {
  const data = await getJson<PaginatedResponse>(
    `${BACKEND_URL}/order/paginated?status=history&page=1&limit=${limit}&sortBy=uploadDate&sortOrder=desc`
  );
  return data.success ? data.data : [];
}

export async function fetchWorkerEntries(userId: string): Promise<WorkerEntry[]> {
  const data = await getJson<WorkerEntry | WorkerEntry[]>(`${BACKEND_URL}/order/user/${userId}`);
  return (Array.isArray(data) ? data : [data]).filter((e) => e?.order && e?.folder);
}

export interface Worker {
  userId: string;
  firstName: string;
}

/** Everyone a folder can be assigned to. */
export async function fetchWorkers(): Promise<Worker[]> {
  const data = await getJson<unknown>(`${BACKEND_URL}/user`);
  if (!Array.isArray(data)) throw new Error("Unexpected /user response");
  return data as Worker[];
}
