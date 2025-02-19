import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface User {
  userId: string;
  firstName: string;
}

interface ChecklistConfirmationDialogProps {
  button?: React.ReactNode;
  title?: string;
  description?: string;
  type?: string;
  users?: User[];
  onConfirm?: (data: {
    completedSteps: string[];
    assignedUser: string;
  }) => void;
  order?: {
    folder?: { _id: string; stepChecklist: string[] };
    order?: { _id: string };
  };
}

const WorkerConfirmationBox: React.FC<ChecklistConfirmationDialogProps> = ({
  button = <Button>Open</Button>,
  title = "Process Confirmation",
  description = "Please complete all steps before proceeding",
  type = "Other",
  users = [],
  order = {}
}) => {
  const [selectedUser, setSelectedUser] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<
    { item: string; index: number; isDone: boolean }[]
  >([]);
  const folderId = order.folder?._id;
  const orderId = order.order?._id;

  const checklistItems = order.folder?.stepChecklist || [];

  const handleCheckboxChange = (item: string, index: number) => {
    const isDone = item.includes("(done)");

    // Check if this item is already in pending updates
    const existingUpdateIndex = pendingUpdates.findIndex(
      (update) => update.index === index
    );

    if (existingUpdateIndex !== -1) {
      // Remove the update if it exists
      setPendingUpdates((prev) =>
        prev.filter((_, i) => i !== existingUpdateIndex)
      );
    } else {
      // Add new update
      setPendingUpdates((prev) => [...prev, { item, index, isDone }]);
    }
  };

  const updateChecklistStatus = async (
    updates: { item: string; index: number; isDone: boolean }[]
  ) => {
    try {
      // Process all updates sequentially
      for (const update of updates) {
        const response = await fetch(
          `https://jovanalbum-system-backend.onrender.com/order/checklist/${
            update.isDone ? "undone" : "done"
          }`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              folderId,
              checklistIndex: update.index
            })
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to update checklist status for index ${update.index}`
          );
        }
      }
    } catch (error) {
      console.error("Error updating checklist statuses:", error);
      throw error;
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const lastCompletedStep = checklistItems
        .filter((item) => item.includes("(done)"))
        .pop();

      if (!lastCompletedStep) return;

      const response = await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/folder/updatestatus",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            orderId,
            folderId,
            status: lastCompletedStep.replace(" (done)", "")
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update folder status");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleAssignFolder = async () => {
    try {
      const response = await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/assign/singlefolder",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ folderId, selectedUser })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign folder");
      }
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const handleConfirm = async () => {
    try {
      if (pendingUpdates.length > 0) {
        await updateChecklistStatus(pendingUpdates);
      }
      await handleUpdateStatus();
      if (selectedUser) {
        await handleAssignFolder();
      }
      setSelectedUser("");
      setPendingUpdates([]);
      setIsDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error during confirmation:", error);
    }
  };

  const isStepCompleted = (item: string) => item.includes("(done)");

  const isPendingUpdate = (index: number) => {
    return pendingUpdates.some((update) => update.index === index);
  };

  const getCheckboxState = (item: string, index: number) => {
    const isDone = isStepCompleted(item);
    const isPending = isPendingUpdate(index);
    return isPending ? !isDone : isDone;
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white max-h-[625px] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h4 className="font-medium">Process Checklist {type}</h4>
            {checklistItems.map((item, index) => {
              const isDone = isStepCompleted(item);
              const displayItem = isDone ? item.replace(" (done)", "") : item;
              const isChecked = getCheckboxState(item, index);

              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`item-${index}`}
                    checked={isChecked}
                    onCheckedChange={() => handleCheckboxChange(item, index)}
                    className={
                      isPendingUpdate(index)
                        ? "bg-yellow-200"
                        : isDone
                        ? "opacity-50"
                        : ""
                    }
                  />
                  <Label
                    htmlFor={`item-${index}`}
                    className={isDone ? "opacity-50" : ""}
                  >
                    {displayItem}
                    {isDone && " (Completed)"}
                    {isPendingUpdate(index) && " (Pending)"}
                  </Label>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select onValueChange={setSelectedUser} value={selectedUser}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {users.map((user) => (
                  <SelectItem key={user.userId} value={user.userId}>
                    {user.firstName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogClose>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleConfirm}
              className="bg-blue-500 text-white"
              disabled={!selectedUser && pendingUpdates.length === 0}
            >
              Confirm{" "}
              {pendingUpdates.length > 0
                ? `(${pendingUpdates.length} updates)`
                : ""}
            </Button>
          </DialogFooter>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default WorkerConfirmationBox;
