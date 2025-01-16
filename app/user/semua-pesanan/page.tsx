import { auth } from "@clerk/nextjs/server";
import { WorkerSemuaPesanan } from "@/components/worker-ui/workerSemuaPesanan";

const WorkerOrdersPage = async () => {
  const { userId } = await auth();
  //pass the userId to props

  return (
    <div>
      <WorkerSemuaPesanan userId={userId ?? ""}></WorkerSemuaPesanan>
      {/* on testing */}
    </div>
  );
};
export default WorkerOrdersPage;
