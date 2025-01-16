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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export function ConfirmationBox(props: {
  order: {
    _id: string;
    sender: { whatsapp: string; name: string };
    folders: {
      _id: string;
      ukuran: string;
      tipe: string;
      description: string;
    }[];
  }[];
  button: React.ReactNode;
  description: string;
  text: string;
  buttonText: string;
  users: { firstName: string; userId: string }[];
}) {
  const order = props.order[0];
  const users = props.users;

  const processTypes = {
    "Cetak Foto": [
      "Admin - Terima",
      "Bojes - Cetak",
      "Bojes - Laminating",
      "Bojes - selesai"
    ],
    "Kolase": [
      "Admin - Terima",
      "Bojes - Cetak",
      "Bojes - Laminating",
      "Bojes - di Urut",
      "Bojes - Naik ke atas",
      "Bojes - Selesai"
    ],
    "Magazine": [
      "Admin - Terima",
      "Bojes - Kirim ke Azis",
      "Azis - Atur Warna & Potong2x",
      "Azis - Proses Cetak",
      "Azis - di Urut",
      "Azis - Naik ke atas",
      "Azis - Selesai"
    ],
    "Semi Magazine": [
      "Admin - Terima",
      "Admin - Edit",
      "Admin - Set warna",
      "Admin - Cetak",
      "Admin - Urut",
      "Admin - Kasih Putra",
      "Admin - Selesai"
    ],
    "Bingkai": [
      "Admin - Terima",
      "Bojes - Cetak",
      "Bojes - Laminating",
      "Admin - Kode Bingkai",
      "Admin - Naik ke atas",
      "Admin - Selesai"
    ],
    "Flash Disk": ["Admin - Terima", "Bojes - Grafir", "Bojes - Selesai"],
    "Other": [
      "Admin - Terima",
      "Bojes - Cetak",
      "Bojes - di Finishing",
      "Bojes - Selesai"
    ]
  };

  // Create state for each folder's worker and description
  const [folderAssignments, setFolderAssignments] = useState(
    order.folders.map(() => ({
      worker: "",
      description: ""
    }))
  );

  const handleWorkerChange = (index: number, workerId: string) => {
    console.log(folderAssignments);
    setFolderAssignments((prev) => {
      const newAssignments = [...prev];
      newAssignments[index] = { ...newAssignments[index], worker: workerId };
      return newAssignments;
    });
  };

  const handleDescriptionChange = (index: number, desc: string) => {
    setFolderAssignments((prev) => {
      const newAssignments = [...prev];
      newAssignments[index] = { ...newAssignments[index], description: desc };
      return newAssignments;
    });
  };

  //assign checklist to folder
  const assignChecklistToFolder = async (
    folderId: string,
    checklist: string[]
  ) => {
    try {
      const response = await fetch(
        "http://localhost:8001/order/assign/checklist",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            folderId,
            checklist
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData); // Debug log
        throw new Error(
          `Failed to assign checklist: ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      console.log("Assignment result:", result); // Debug log
      return result.folder;
    } catch (error) {
      console.error("Error assigning checklist:", error);
      throw error;
    }
  };

  const handleSend = async () => {
    try {
      // 1. Change order status to "on-process"
      const acceptResponse = await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/accept",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        }
      );
      if (!acceptResponse.ok) throw new Error("Failed to accept order");

      // 2. Create tracking ID
      const trackingResponse = await fetch(
        "https://jovanalbum-system-backend.onrender.com/tracking/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: order._id })
        }
      );
      if (!trackingResponse.ok) throw new Error("Tracking creation failed");
      const trackingData = await trackingResponse.json();

      // Add tracking ID to order
      const trackingId = trackingData.trackingId;
      await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/tracking",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: order._id, trackingId: trackingId })
        }
      );

      // 3. Assign folders to workers
      for (let i = 0; i < folderAssignments.length; i++) {
        const assignment = folderAssignments[i];
        if (assignment.worker) {
          await fetch(
            // "https://jovanalbum-system-backend.onrender.com/order/folder/assign",
            "http://localhost:8001/order/folder/assign",
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assigneeId: assignment.worker,
                orderId: order._id,
                folderId: order.folders[i]._id,
                workingDescription: assignment.description,
                folderIndex: i // Add folder index to identify which folder is assigned
              })
            }
          );
        }

        // 3. Process each folder: assign workers and checklists
        for (let i = 0; i < order.folders.length; i++) {
          const folder = order.folders[i];
          const assignment = folderAssignments[i];

          // Assign worker if selected
          if (assignment.worker) {
            await fetch("http://localhost:8001/order/folder/assign", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assigneeId: assignment.worker,
                orderId: order._id,
                folderId: folder._id,
                workingDescription: assignment.description,
                folderIndex: i
              })
            });
          }

          // Assign checklist based on folder type
          try {
            const checklistForType =
              processTypes[folder.tipe as keyof typeof processTypes] ||
              processTypes["Other"];
            await assignChecklistToFolder(folder._id, checklistForType);

            // Mark first step as done (Admin - Terima)
            await fetch("http://localhost:8001/order/checklist/done", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                folderId: folder._id,
                checklistIndex: 0 // First step
              })
            });
          } catch (error) {
            console.error(
              `Failed to process checklist for folder ${i}:`,
              error
            );
          }
        }

        //4. update the tracking status
        await fetch("http://localhost:8001/order/checklist/done", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folderId: order.folders[i]._id,
            checklistIndex: 0
          })
        });
      }

      // 5. Send WhatsApp notification
      const phoneNumber = order.sender.whatsapp
        .replace(/^0/, "62")
        .replace(/[-+ ]/g, "");

      // Create folder details message
      const folderDetailsMessage = order.folders
        .map(
          (folder, index) =>
            `Folder ${index + 1}:%0Aukuran: ${folder.ukuran}%0Adeskripsi: ${
              folder.description
            }`
        )
        .join("%0A__________________________%0A");

      window.open(
        `https://wa.me/${phoneNumber}?text=*PESANANMU*%20*SUDAH*%20*KAMI*%20*TERIMA!*%0A.......%0ATerima%20kasih!%20pesananmu%20atas%20nama:%20${order.sender.name}%20telah%20kami%20terima%20dan%20akan%20segera%20di%20proses!%0A%0A__________________________%0Arincian%20pesanan:%0A${folderDetailsMessage}%0A__________________________%0A%0Anomor%20order:%20*${trackingId}*%0ATrack%20Pesanan%20mu%20disini:%20https%3A%2F%2Fjovanalbumsystem.web.app%2Ftrack%2F${trackingId}%0A.......%0A*%20Jovan%20Album%20*`,
        "_blank",
        "noopener,noreferrer"
      );

      // Reset and refresh
      setFolderAssignments(
        order.folders.map(() => ({ worker: "", description: "" }))
      );
      window.location.reload();
    } catch (error) {
      console.error("Failed to process order:", error);
    }
  };

  const handleReject = async () => {
    try {
      await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/delete/fullorder",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        }
      );
      window.location.reload();
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{props.button}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white max-h-[625px] overflow-auto">
        <DialogHeader>
          <DialogTitle>{props.text}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        {props.text === "Terima" ? (
          <div className="grid gap-4 py-4">
            {order.folders.map((folder, index) => (
              <div
                key={index}
                className="space-y-4 border-b pb-4 last:border-0"
              >
                <h4 className="font-medium">
                  Folder {index + 1}: {`${folder.tipe ? folder.tipe : "tipe"}`}-
                  {folder.ukuran}
                </h4>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`worker-${index}`} className="text-right">
                    Worker
                  </Label>
                  <Select
                    onValueChange={(value) => handleWorkerChange(index, value)}
                    value={folderAssignments[index].worker}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a worker" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {users.map((user) => (
                        <SelectItem
                          key={user.userId}
                          value={user.userId}
                          className="hover:bg-gray-100"
                        >
                          {user.firstName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor={`description-${index}`}
                    className="text-right"
                  >
                    Description
                  </Label>
                  <Textarea
                    id={`description-${index}`}
                    placeholder="Enter description"
                    value={folderAssignments[index].description}
                    onChange={(e) =>
                      handleDescriptionChange(index, e.target.value)
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p></p>
        )}

        <DialogClose>
          <DialogFooter>
            {props.text === "Terima" ? (
              <Button
                type="submit"
                onClick={handleSend}
                className="bg-green-300"
              >
                {props.buttonText}
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={handleReject}
                className="bg-red-300"
              >
                {props.buttonText}
              </Button>
            )}
          </DialogFooter>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
