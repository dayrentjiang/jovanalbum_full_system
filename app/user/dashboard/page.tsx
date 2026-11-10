import { auth } from "@clerk/nextjs/server";
import { WorkerDashboard } from "@/components/worker-ui/workerDashboard";

export default async function WorkerDashboardPage() {
  const { userId } = await auth();
  return <WorkerDashboard userId={userId ?? ""} />;
}
