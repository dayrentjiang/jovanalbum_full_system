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
    folders: { ukuran: string; description: string }[];
  }[];
  button: React.ReactNode;
  description: string;
  text: string;
  buttonText: string;
  users: { firstName: string; userId: string }[];
}) {
  const [selectedWorker, setSelectedWorker] = useState("");
  const [description, setDescription] = useState("");

  const order = props.order[0]; // Assuming order is an array with one object
  const users: { firstName: string; userId: string }[] = props.users;

  const handleSend = async () => {
    // Implement your send logic here
    console.log("Sending:", { worker: selectedWorker, description });
    console.log(order);

    // //flow
    try {
      //1. change the status of the order to "on-process"
      const acceptResponse = await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/accept",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(order)
        }
      );
      if (!acceptResponse.ok) {
        throw new Error("Failed to accept order");
      }
      const acceptData = await acceptResponse.json(); // Parse the response
      console.log("Order accepted successfully:", acceptData);

      //2. create tracking ID
      // Then, send the POST request to create the tracking
      const trackingResponse = await fetch(
        "https://jovanalbum-system-backend.onrender.com/tracking/create",
        {
          // fetch("http://localhost:8001/tracking/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: order._id }) // Ensure _id is included
        }
      );

      if (!trackingResponse.ok) {
        throw new Error(`Tracking creation failed: ${trackingResponse}`);
      }

      const trackingData = await trackingResponse.json(); // Parse the response
      console.log("Tracking created successfully:", trackingData);

      //add the tracking ID to the order in the database
      const trackingId = trackingData.trackingId; //kasih masuk ini ke database
      const trackingOrder = await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/tracking",
        // "http://localhost:8001/order/tracking",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: order._id, trackingId: trackingId })
        }
      );
      console.log(trackingOrder);

      //3. send the order and description to the worker (insert into their array of orders)
      console.log("Assigning order to worker:", selectedWorker);
      if (selectedWorker) {
        const workerResponse = await fetch(
          "https://jovanalbum-system-backend.onrender.com/user/order", //change to asign instead of order
          // "http://localhost:8001/user/order", //change to asign instead of order
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              userId: selectedWorker, //ini sudah id nya
              order: order._id,
              workingDescription: description
            })
          }
        );

        if (!workerResponse.ok) {
          throw new Error("Failed to assign order to worker");
        }

        const workerData = await workerResponse.json();
        console.log("Order assigned to worker successfully:", workerData);
      }

      //   //4. send a notification to customer that their order is being processed (with the tracking order)
      // Send WhatsApp message to sender in a new tab
      //replace 0 with 62 in the phone number and remove all - and + in the phone number and remove all space
      const phoneNumber = order.sender.whatsapp
        .replace(/^0/, "62") // Replace leading '0' with '62'
        .replace(/[-+ ]/g, ""); // Remove all '-', '+', and spaces
      const senderName = order.sender.name;

      // Ensure this is triggered by a user event (like a click)
      // how to include the folder ukuran and description in the message?
      const folderDetails = order.folders;
      const folder1Ukuran = folderDetails[0].ukuran;
      const folder1Deskripsi = folderDetails[0].description;
      window.open(
        `https://wa.me/${phoneNumber}?text=*PESANANMU*%20*SUDAH*%20*KAMI*%20*TERIMA!*%0A.......%0ATerima%20kasih!%20pesananmu%20atas%20nama:%20${senderName}%20telah%20kami%20terima%20dan%20akan%20segera%20di%20proses!%0A%0A__________________________%0Arincian%20pesanan:%0Aukuran:%20${folder1Ukuran}%0Adeskripsi:%20${folder1Deskripsi}%20%7C%7C%0A__________________________%0A%0Anomor%20order:%20*${trackingId}*%0ATrack%20Pesanan%20mu%20disini:%20https%3A%2F%2Fjovanalbumsystem.web.app%2Ftrack%2F${trackingId}%0A.......%0A*%20Jovan%20Album%20*`,
        "_blank",
        "noopener,noreferrer"
      );

      // 5. update the tracking status

      //close the dialog
      setSelectedWorker("");
      setDescription("");
      //refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Failed to accept order:", error);
    }
  };

  const handleReject = async () => {
    console.log("Rejecting");
    try {
      fetch(
        "https://jovanalbum-system-backend.onrender.com/order/delete/fullorder",
        {
          // fetch("http://localhost:8001/order/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        }
      );

      //refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{props.button}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>{props.text}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        {props.text === "Terima" ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="worker" className="text-right">
                Worker
              </Label>
              <Select onValueChange={setSelectedWorker} value={selectedWorker}>
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
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
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
