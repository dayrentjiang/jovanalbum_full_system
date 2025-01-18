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

export function SelesaiBox(props: {
  order: []; // Consider creating a proper type for your order
  button: React.ReactNode;
  onOrderComplete?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelesai = async () => {
    setIsLoading(true);
    try {
      // Delete tracking
      const trackingResponse = await fetch(
        "https://jovanalbum-system-backend.onrender.com/tracking/delete",
        // "http://localhost:8001/tracking/delete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(props.order)
        }
      );
      console.log("Tracking delete response:", await trackingResponse.text());

      // Delete order
      const orderDeleteResponse = await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/delete",
        // "http://localhost:8001/order/delete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(props.order)
        }
      );
      console.log("Order delete response:", await orderDeleteResponse.text());

      // Move to history
      const historyResponse = await fetch(
        "https://jovanalbum-system-backend.onrender.com/order/history",
        // "http://localhost:8001/order/history",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(props.order)
        }
      );
      console.log("History update response:", await historyResponse.text());

      // Call the callback if provided
      if (props.onOrderComplete) {
        props.onOrderComplete();
      }
    } catch (error) {
      console.error("Error completing order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{props.button}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Complete Order</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark this order as complete? This action
            will:
            <ul className="list-disc pl-5 mt-2">
              <li>Remove the order from active orders</li>
              <li>Delete the tracking information</li>
              <li>Move the order to order history</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={handleSelesai}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600"
            >
              {isLoading ? "Processing..." : "Complete Order"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
