import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface OrderProps {
  order: {
    _id: string;
    sender: { whatsapp: string; name: string };
    estimatedFinish: Date;
    folders: {
      _id: string;
      ukuran: string;
      tipe: string;
      description: string;
      stepChecklist: string[];
      kodeOrder: string;
    }[];
  }[];
  button: React.ReactNode;
  description: string;
  text: string;
  buttonText: string;
  users: { firstName: string; userId: string }[];
}

export function ConfirmationBox(props: OrderProps) {
  const order = props.order[0];
  const users = props.users;
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    "Semi Kolase": [
      "Admin - Terima",
      "Admin - Edit",
      "Admin - Set warna",
      "Admin - Cetak",
      "Admin - Urut",
      "Admin - Kasih Putra",
      "Admin - Selesai"
    ],
    "Cetak+Bingkai": [
      "Admin - Terima",
      "Bojes - Cetak",
      "Bojes - Laminating",
      "Bojes - Kode Bingkai",
      "Bojes - Naik ke atas",
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

  const [folderAssignments, setFolderAssignments] = useState(
    order.folders.map(() => ({
      worker: "",
      description: ""
    }))
  );

  const handleWorkerChange = (index: number, workerId: string) => {
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

  const assignChecklistToFolder = async (
    folderId: string,
    checklist: string[]
  ) => {
    const response = await fetch(
      "https://jovanalbum-system-backend.onrender.com/order/assign/checklist",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, checklist })
      }
    );

    if (!response.ok) {
      throw new Error("Failed to assign checklist");
    }

    return await response.json();
  };

  const handleFinish = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const responses = await Promise.all([
        fetch("https://jovanalbum-system-backend.onrender.com/order/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        }),
        fetch("https://jovanalbum-system-backend.onrender.com/order/history", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        })
      ]);

      const allSuccessful = responses.every((response) => response.ok);

      if (allSuccessful) {
        const results = await Promise.all(responses.map((res) => res.json()));
        console.log("Order finished successfully:", results);

        // Wait for backend to process
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsOpen(false);
        window.location.reload();
      } else {
        throw new Error("One or more requests failed");
      }
    } catch (error) {
      console.error("Error completing order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // 1. Accept order
      const acceptResponse = await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/accept",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        }
      );

      if (!acceptResponse.ok) throw new Error("Failed to accept order");

      // 2. Create tracking
      const trackingResponse = await fetch(
        "https://jovanalbum-system-backend.onrender.com/tracking/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: order._id })
        }
      );

      if (!trackingResponse.ok) throw new Error("Failed to create tracking");
      const { trackingId } = await trackingResponse.json();

      // 3. Add tracking to order
      await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/tracking",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: order._id, trackingId })
        }
      );

      // 4. Process folders
      for (let i = 0; i < order.folders.length; i++) {
        const folder = order.folders[i];
        const assignment = folderAssignments[i];

        if (assignment.worker) {
          await fetch(
            "https://jovanalbum-system-backend.onrender.com/order/folder/assign",
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assigneeId: assignment.worker,
                orderId: order._id,
                folderId: folder._id,
                workingDescription: assignment.description,
                folderIndex: i
              })
            }
          );
        }

        // Assign and process checklist
        const checklistForType =
          processTypes[folder.tipe as keyof typeof processTypes] ||
          processTypes["Other"];
        await assignChecklistToFolder(folder._id, checklistForType);

        // Mark first step as done
        await fetch(
          "https://jovanalbum-system-backend.onrender.com/order/checklist/done",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folderId: folder._id,
              checklistIndex: 0
            })
          }
        );
      }

      // 5. Send WhatsApp
      const phoneNumber = order.sender.whatsapp
        .replace(/^0/, "62")
        .replace(/[-+ ]/g, "");

      const estimatedFinish = order.estimatedFinish
        ? format(new Date(order.estimatedFinish), "dd-MMM-yyyy")
        : "belum ada estimasi selesai";

      const folderDetailsMessage = order.folders
        .map(
          (folder, index) =>
            `Folder ${index + 1}:
${folder.tipe ? `tipe: ${folder.tipe}` : ""}
${folder.kodeOrder ? `kode order: ${folder.kodeOrder}` : ""} 
ukuran: ${folder.ukuran}
deskripsi: ${folder.description} ||`
        )
        .join("\n\n");

      const message = `*PESANANMU* *SUDAH* *KAMI* *TERIMA!*
.......
Terima kasih! pesananmu atas nama: ${order.sender.name} telah kami terima dan akan segera di proses!

__________________________
rincian pesanan:

${folderDetailsMessage}
__________________________

Perkiraan Selesai: ${estimatedFinish}
Klik disini untuk Lihat Proses Pesanan-mu:
https://jovanalbumsystem.web.app/track/${trackingId}
.......
* Jovan Album *`;

      window.open(
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );

      // Wait for backend to process
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to process order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/delete/fullorder",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        }
      );

      if (!response.ok) throw new Error("Failed to reject order");

      // Wait for backend to process
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error rejecting order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {props.button}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white max-h-[625px] overflow-auto">
        <DialogHeader>
          <DialogTitle>{props.text}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>

        {props.text === "Terima" && (
          <div className="grid gap-4 py-4">
            {order.folders.map((folder, index) => (
              <div
                key={index}
                className="space-y-4 border-b pb-4 last:border-0"
              >
                <h4 className="font-medium">
                  Folder {index + 1}: {folder.tipe || "tipe"}-{folder.ukuran}
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
        )}

        <DialogFooter>
          {props.text === "Terima" ? (
            <Button
              type="submit"
              onClick={handleSend}
              disabled={isLoading}
              className="bg-green-300 hover:bg-green-400 disabled:bg-gray-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                props.buttonText
              )}
            </Button>
          ) : props.text === "Finish" ? (
            <Button
              type="submit"
              onClick={handleFinish}
              disabled={isLoading}
              className="bg-green-300 hover:bg-green-400 disabled:bg-gray-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Finishing...
                </>
              ) : (
                props.buttonText
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleReject}
              disabled={isLoading}
              className="bg-red-300 hover:bg-red-400 disabled:bg-gray-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Rejecting...
                </>
              ) : (
                props.buttonText
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
