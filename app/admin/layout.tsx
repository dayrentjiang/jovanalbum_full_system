import "@/app/globals.css";
import { Sidebar } from "@/components/admin-ui/sidebar";

export const metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for managing orders"
};

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white">{children}</main>
    </div>
  );
}
