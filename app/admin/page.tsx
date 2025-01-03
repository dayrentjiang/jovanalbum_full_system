import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <div className="flex h-screen bg-white">
      <main className="flex-1 overflow-y-auto bg-white">
        <Dashboard />
      </main>
    </div>
  );
}
