import { Sidebar } from "@/components/sidebar";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white">
        <Dashboard />
      </main>
    </div>
  );
}
