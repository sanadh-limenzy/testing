// import React from "react";
import { getCurrentUserServer } from "@/lib/auth-server";
// import { ProfileCompletionWrapper } from "@/components/client/ProfileCompletionWrapper";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/auth");
    return null;
  }

  const user_type = user.user_metadata.user_type;
  if (user_type === "Subscriber") {
    redirect("/subscriber/home");
  } else if (user_type === "Admin") {
    redirect("/admin/home");
  } else {
    redirect("/accountant/home");
  }

  // return (
  //   <div className="w-full">
  //     <ProfileCompletionWrapper user={user} />
  //   </div>
  // );
}
//
