import { ShareFilingInfoForm } from "@/components/share-filing-info/ShareFilingInfoForm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { env } from "@/env";
export const dynamic = "force-dynamic";

async function getAccountantEmail() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    // Fetch user data from API route
    const baseUrl = env.NEXT_PUBLIC_APP_URL
    const response = await fetch(`${baseUrl}/api/user_data`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401) {
        redirect("/auth");
      }
      console.error("Failed to fetch user data:", response.statusText);
      return null;
    }

    const data = await response.json();

    // Check if user has an accountant linked
    if (data.subscriberProfile?.accountant_profile?.user_profile) {
      // Handle both array and object responses
      const userProfile = Array.isArray(
        data.subscriberProfile.accountant_profile.user_profile
      )
        ? data.subscriberProfile.accountant_profile.user_profile[0]
        : data.subscriberProfile.accountant_profile.user_profile;

      return userProfile?.email || null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching accountant email:", error);
    return null;
  }
}

export default async function ShareFilingInfoPage() {
  const accountantEmail = await getAccountantEmail();
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Tax Filing {currentYear}
      </h1>

      {/* Form Section */}
      <ShareFilingInfoForm
        accountantEmail={accountantEmail}
        selectedYear={currentYear}
      />
    </div>
  );
}
