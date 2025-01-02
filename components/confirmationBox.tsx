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

// Assume this comes from your database
const workerNames = [
  "John Doe",
  "Jane Smith",
  "Alice Johnson",
  "Bob Williams",
  "Charlie Brown"
];

export function ConfirmationBox(props: {
  order: [];
  button: React.ReactNode;
  description: string;
  text: string;
  buttonText: string;
}) {
  const [selectedWorker, setSelectedWorker] = useState("");
  const [description, setDescription] = useState("");

  const order = props.order;

  const handleSend = () => {
    // Implement your send logic here
    console.log("Sending:", { worker: selectedWorker, description });
    console.log(order);
    //close the dialog
    setSelectedWorker("");
    setDescription("");
  };

  const handleReject = () => {
    console.log("Rejecting");
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
                  {workerNames.map((name) => (
                    <SelectItem
                      key={name}
                      value={name}
                      className="hover:bg-gray-100"
                    >
                      {name}
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
