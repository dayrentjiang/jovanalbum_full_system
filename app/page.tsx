import { SignedOut, SignInButton } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
      <Card className="w-[350px] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Jovan Album Admin
          </CardTitle>
          <CardDescription>Sign in to access your admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="w-full">Sign In</Button>
            </SignInButton>
          </SignedOut>
        </CardContent>
      </Card>
    </div>
  );
}
