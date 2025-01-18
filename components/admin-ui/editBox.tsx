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
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface EditBoxProps {
  order: {
    _id: string;
    sender: { whatsapp: string; name: string };
    folders: {
      ukuran: string;
      description: string;
      driveLink?: string;
      tipe?: string;
      kodeOrder?: string; // Added kodeOrder to the interface
      assignee?: string;
      stepChecklist?: string[]; // Added stepChecklist to the interface
    }[];
    trackingId?: string;
  }[];
  button: React.ReactNode;
  users: { firstName: string; userId: string }[];
}

export function EditBox(props: EditBoxProps) {
  const order = props.order[0];
  const [formData, setFormData] = useState({
    sender: {
      name: order.sender.name,
      whatsapp: order.sender.whatsapp
    },
    folders: order.folders.map((folder) => ({
      ...folder,
      driveLink: folder.driveLink || "",
      tipe: folder.tipe || "",
      kodeOrder: folder.kodeOrder || "", // Added kodeOrder to the state
      assignee: folder.assignee || "",
      stepChecklist: folder.stepChecklist || []
    }))
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string,
    index: number | null = null
  ) => {
    const { name, value } = e.target;

    if (field === "sender") {
      setFormData((prev) => ({
        ...prev,
        sender: {
          ...prev.sender,
          [name]: value
        }
      }));
    } else if (field === "folders" && index !== null) {
      const updatedFolders = [...formData.folders];
      updatedFolders[index] = {
        ...updatedFolders[index],
        [name]: value
      };
      setFormData((prev) => ({
        ...prev,
        folders: updatedFolders
      }));
    }
  };

  const handleAssigneeChange = (value: string, index: number) => {
    const updatedFolders = [...formData.folders];
    updatedFolders[index] = {
      ...updatedFolders[index],
      assignee: value
    };
    setFormData((prev) => ({
      ...prev,
      folders: updatedFolders
    }));
  };

  const handleEdit = async () => {
    try {
      const response = await fetch(
        `https://jovanalbum-system-backend.onrender.com/order/update/${order._id}`,
        // `http://localhost:8001/order/update/${order._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      console.log("Order updated successfully");
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleWhatsAppResend = () => {
    const phoneNumber = formData.sender.whatsapp.replace(/\D/g, "");
    const senderName = formData.sender.name;
    const trackingId = order.trackingId || "";

    const foldersDetails = formData.folders
      .map((folder, index) => {
        const folderNumber = index + 1;
        return `Folder ${folderNumber}:
${folder.tipe ? `tipe: ${folder.tipe}` : ""}
${folder.kodeOrder ? `kode order: ${folder.kodeOrder}` : ""} 
ukuran: ${folder.ukuran}
deskripsi: ${folder.description} ||`;
      })
      .join("\n\n");

    const message = `*PESANANMU* *SUDAH* *KAMI* *TERIMA!*
.......
Terima kasih! pesananmu atas nama: ${senderName} telah kami terima dan akan segera di proses!

__________________________
rincian pesanan:

${foldersDetails}
__________________________

nomor order: *${trackingId}*
Track Pesanan mu disini: https://jovanalbumsystem.web.app/track/${trackingId}
.......
* Jovan Album *`;

    const encodedMessage = encodeURIComponent(message);

    window.open(
      `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{props.button}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[625px] overflow-auto bg-white">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>
            Make changes to the order details below
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Sender Information section */}
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Sender Information</h3>
              <Button
                type="button"
                onClick={handleWhatsAppResend}
                className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Resend WhatsApp
              </Button>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.sender.name}
                onChange={(e) => handleInputChange(e, "sender")}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp" className="text-right">
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                value={formData.sender.whatsapp}
                onChange={(e) => handleInputChange(e, "sender")}
                className="col-span-3"
              />
            </div>
          </div>

          {/* Folders section */}
          <div className="grid gap-2">
            <h3 className="font-semibold">Folders</h3>
            {formData.folders.map((folder, index) => (
              <div key={index} className="grid gap-2 border p-4 rounded-lg">
                <h4 className="font-medium">Folder {index + 1}</h4>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`assignee-${index}`} className="text-right">
                    Assignee
                  </Label>
                  <Select
                    value={folder.assignee}
                    onValueChange={(value) =>
                      handleAssigneeChange(value, index)
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select an assignee" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {props.users.map((user) => (
                        <SelectItem key={user.userId} value={user.userId}>
                          {user.firstName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`tipe-${index}`} className="text-right">
                    Type
                  </Label>
                  <Input
                    id={`tipe-${index}`}
                    name="tipe"
                    value={folder.tipe}
                    onChange={(e) => handleInputChange(e, "folders", index)}
                    className="col-span-3"
                  />
                </div>
                {/* Added Kode Order field */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`kodeOrder-${index}`} className="text-right">
                    Kode Order
                  </Label>
                  <Input
                    id={`kodeOrder-${index}`}
                    name="kodeOrder"
                    value={folder.kodeOrder}
                    onChange={(e) => handleInputChange(e, "folders", index)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`ukuran-${index}`} className="text-right">
                    Size
                  </Label>
                  <Input
                    id={`ukuran-${index}`}
                    name="ukuran"
                    value={folder.ukuran}
                    onChange={(e) => handleInputChange(e, "folders", index)}
                    className="col-span-3"
                  />
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
                    name="description"
                    value={folder.description}
                    onChange={(e) => handleInputChange(e, "folders", index)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`driveLink-${index}`} className="text-right">
                    Drive Link
                  </Label>
                  <Input
                    id={`driveLink-${index}`}
                    name="driveLink"
                    value={folder.driveLink}
                    onChange={(e) => handleInputChange(e, "folders", index)}
                    className="col-span-3"
                    placeholder="Enter Google Drive link"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="submit"
              onClick={handleEdit}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Save Changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
