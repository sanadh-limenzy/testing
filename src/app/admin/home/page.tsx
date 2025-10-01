import { StatisticsCard } from "@/components/admin/StatisticsCard";
import { SignupChart } from "@/components/admin/SignupChart";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { env } from "@/env";

export const dynamic = "force-dynamic";

interface SignupChartData {
  date: string;
  signups: number;
}

interface AdminStatistics {
  totalPlannedEvents: number;
  totalCompletedEvents: number;
  currentUserCount: number;
  totalProfitTransactions: number;
  signupChartData: SignupChartData[];
  weekOverWeekChange: number;
}

async function getAdminStatistics(): Promise<AdminStatistics | null | "Forbidden"> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const baseUrl = env.NEXT_PUBLIC_APP_URL;
    const response = await fetch(`${baseUrl}/api/admin/statistics`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401) {
        redirect("/auth");
      }
      if (response.status === 403) {
        return "Forbidden";
      }
      console.error("Failed to fetch admin statistics:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return null;
  }
}

export default async function AdminHomePage() {
  const statistics = await getAdminStatistics();

  if(statistics === "Forbidden") {
    return notFound();
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-white p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Unable to load statistics.</p>
      </div>
    );
  }
  const formattedProfit = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(statistics.totalProfitTransactions);

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <StatisticsCard
            title="Total Planned Events"
            value={statistics.totalPlannedEvents}
          />
          <StatisticsCard
            title="Total Completed Events"
            value={statistics.totalCompletedEvents}
          />
          <StatisticsCard
            title="Current User Count"
            value={statistics.currentUserCount}
          />
          <StatisticsCard title="Total Revenue" value={formattedProfit} />
        </div>

        {/* Signup Chart */}
        <SignupChart
          data={statistics.signupChartData}
          weekOverWeekChange={statistics.weekOverWeekChange}
        />
      </div>
    </div>
  );
}
