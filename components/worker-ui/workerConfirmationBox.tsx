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
  const folderId = order.folder?._id;
  const orderId = order.order?._id;

  const checklistItems = order.folder?.stepChecklist || [];

  const handleCheckboxChange = async (item: string, index: number) => {
    const isDone = item.includes("(done)");

    try {
      const response = await fetch(
        `https://jovanalbum-system-backend.onrender.com/order/checklist/${
          isDone ? "undone" : "done"
        }`,
        // `http://localhost:8001/order/checklist/${isDone ? "undone" : "done"}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            folderId,
            checklistIndex: index
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update checklist status");
      }

      // Refresh the order data after updating the checklist
      // You might want to implement a refresh function here or use a state management solution
      window.location.reload(); // Temporary solution - you might want to implement a more elegant refresh
    } catch (error) {
      console.error("Error updating checklist status:", error);
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
        // "http://localhost:8001/order/folder/updatestatus",
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
        // "http://localhost:8001/order/assign/singlefolder",
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
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleConfirm = async () => {
    await handleUpdateStatus();
    await handleAssignFolder();
    setSelectedUser("");
    setIsDialogOpen(false);
  };

  const isStepCompleted = (item: string) => item.includes("(done)");

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

              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`item-${index}`}
                    checked={isDone}
                    onCheckedChange={() => handleCheckboxChange(item, index)}
                    className={isDone ? "opacity-50" : ""}
                  />
                  <Label
                    htmlFor={`item-${index}`}
                    className={isDone ? "opacity-50" : ""}
                  >
                    {displayItem}
                    {isDone && " (Completed)"}
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
              disabled={!selectedUser}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default WorkerConfirmationBox;
