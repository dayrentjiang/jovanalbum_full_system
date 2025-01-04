import { UserButton } from "@clerk/nextjs";

export default async function UserDashboard() {
  return (
    <div>
      <UserButton />
      <p>
        This is the protected user dashboard restricted to users with the `user`
        role.
      </p>
    </div>
  );
}

//later the admin semua-pesanan will fetch one by one order using the orderId
