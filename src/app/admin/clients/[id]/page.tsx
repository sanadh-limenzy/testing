import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ClientDetailClient } from "./ClientDetailClient";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  addedOn: string;
  currentPlan: string;
  planStatus: "active" | "inactive";
  referredBy: string;
  status: "active" | "inactive";
  businessName?: string;
  userType: "Admin" | "Subscriber" | "Accountant" | "Vendor";
  isActive: boolean;
  isSubscriptionActive: boolean;
  planStartDate?: string;
  planEndDate?: string;
  taxPro?: string;
}

interface ClientResponse {
  success: boolean;
  data: Client;
}

async function getClient(id: string): Promise<ClientResponse> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/admin/clients/${id}`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (response.status === 403) {
        throw new Error("Forbidden");
      }
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch client: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching client:", error);
    throw error;
  }
}

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const clientData = await getClient((await params).id);
  const client = clientData.data;

  return <ClientDetailClient client={client} />;
}
