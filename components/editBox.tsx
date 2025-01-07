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

export function EditBox(props: {
  order: {
    _id: string;
    sender: { whatsapp: string; name: string };
    folders: { ukuran: string; description: string }[];
  }[];
  button: React.ReactNode;
}) {
  const order = props.order[0];
  const [formData, setFormData] = useState({
    sender: {
      name: order.sender.name,
      whatsapp: order.sender.whatsapp
    },
    folders: order.folders
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

  const handleEdit = async () => {
    try {
      const response = await fetch(
        // `https://jovanalbum-system-backend.onrender.com/order/update/${order._id}`,
        `http://localhost:8001/order/update/${order._id}`,
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

      // Handle success (e.g., close dialog, show notification)
      console.log("Order updated successfully");

      //update UI with the new data without windows refresh
    } catch (error) {
      console.error("Error updating order:", error);
    }
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
          {/* Sender Information */}
          <div className="grid gap-2">
            <h3 className="font-semibold">Sender Information</h3>
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

          {/* Folders */}
          <div className="grid gap-2">
            <h3 className="font-semibold">Folders</h3>
            {formData.folders.map((folder, index) => (
              <div key={index} className="grid gap-2 border p-4 rounded-lg">
                <h4 className="font-medium">Folder {index + 1}</h4>
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
