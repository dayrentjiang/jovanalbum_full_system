"use client";

import { WorkerSemuaPesanan } from "@/components/worker-ui/workerSemuaPesanan";
import { useParams } from "next/navigation";

const WorkerOrdersPage = () => {
  const params = useParams();
  const userId = params?.id as string;

  return (
    <div>
      <WorkerSemuaPesanan userId={userId}></WorkerSemuaPesanan>
    </div>
  );
};

export default WorkerOrdersPage;
