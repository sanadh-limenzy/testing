
import { cookies } from "next/headers";
import { ClientsPageClient } from "./ClientsPageClient";

export const dynamic = "force-dynamic";

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
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ClientsResponse {
  success: boolean;
  data: Client[];
  pagination: PaginationInfo;
}

async function getClients(page: number = 1): Promise<ClientsResponse> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/clients?page=${page}&limit=15`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (response.status === 403) {
        throw new Error("Forbidden");
      }
      const errorText = await response.text();
      throw new Error(`Failed to fetch clients: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
}

export default async function AdminClientsPage() {
  const clientsData = await getClients();

  return (
    <ClientsPageClient 
      initialClients={clientsData.data}
      initialPagination={clientsData.pagination}
    />
  );
}
