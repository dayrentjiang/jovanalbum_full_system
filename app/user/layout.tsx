import "@/app/globals.css";
import { Inter } from "next/font/google";
import { WorkerSidebar } from "@/components/worker-ui/workerSidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Worker Dashboard",
  description: "Worker dashboard for managing orders"
};

export default function WorkerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-white">
          <WorkerSidebar />
          <main className="flex-1 overflow-y-auto bg-white">{children}</main>
        </div>
      </body>
    </html>
  );
}
