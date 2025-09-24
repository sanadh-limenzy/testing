"use server";

import { redirect } from "next/navigation";

export const redirectUserToHome = async (
  userType?: "Subscriber" | "Accountant" | "Admin" | null
) => {
  if (userType === "Subscriber") {
    redirect("/subscriber/home");
  } else if (userType === "Accountant") {
    redirect("/accountant/home");
  } else if (userType === "Admin") {
    redirect("/admin/home");
  }
}