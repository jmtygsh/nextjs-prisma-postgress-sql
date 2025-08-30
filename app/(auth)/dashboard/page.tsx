"use client";

import { doSignOut } from "@/lib/authcontrol";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading session...</p>;
  }

  if (status === "unauthenticated") {
    return <p>You are not signed in</p>;
  }

  return (
    <div>
      <p>Signed in as {session?.user?.email}</p>
      <form action={doSignOut}>
        <button type="submit">Sign out</button>
      </form>
    </div>
  );
}
