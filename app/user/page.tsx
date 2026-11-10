import { redirect } from "next/navigation";

// Workers land on /user after sign-in; send them straight to their dashboard.
export default function UserHome() {
  redirect("/user/dashboard");
}
