import { SignedOut, SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex justify-center space-x-4">
      <div>
        <SignedOut>
          <SignInButton />
        </SignedOut>
      </div>
      <h1>Jovan Album Admin</h1>
    </div>
  );
}
