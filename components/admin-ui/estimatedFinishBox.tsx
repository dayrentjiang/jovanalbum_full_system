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
import { Input } from "@/components/ui/input";

export function EstimatedDeliveryBox(props: {
  orderId: string;
  button: React.ReactNode;
}) {
  const orderId = props.orderId;
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  const handleEstimated = async () => {
    console.log("Attempting to send data:", {
      orderId,
      estimatedDelivery
    });

    try {
      const response = await fetch(
        `http://localhost:8001/order/update/estimatedFinish/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            estimatedFinish: estimatedDelivery
          })
        }
      );

      // Log the full response details
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const responseData = await response.text();
      console.log("Response body:", responseData);

      // Try to parse if it's JSON
      try {
        const jsonData = JSON.parse(responseData);
        console.log("Parsed JSON:", jsonData);
      } catch (error) {
        console.log("Response was not JSON", error);
      }
    } catch (error) {
      console.error("Detailed error:", {
        message: error
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{props.button}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Set Estimated Delivery</DialogTitle>
          <DialogDescription>
            Set or update the estimated delivery date for this order
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="estimatedDelivery" className="text-right">
              Delivery Date
            </Label>
            <Input
              id="estimatedDelivery"
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="submit"
              onClick={handleEstimated}
              className="bg-blue-500 hover:bg-blue-600"
            >
              update Estimated Day
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
