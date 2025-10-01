"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Link, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ClientStatusSelect } from "./ClientStatusSelect";
import { ClientsPagination } from "./ClientsPagination";

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

interface ClientsTableProps {
  initialClients: Client[];
  initialPagination: PaginationInfo;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

export function ClientsTable({
  initialClients,
  initialPagination,
  onPageChange,
  loading: externalLoading = false,
}: ClientsTableProps) {
  const router = useRouter();
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  
  // Use the data passed from parent instead of internal state
  const clients = initialClients;
  const pagination = initialPagination;

  const handlePageChange = (page: number) => {
    if (externalLoading) return;
    
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleStatusChange = (
    clientId: string,
    newStatus: "active" | "inactive"
  ) => {
    // Status changes are now handled by React Query mutations
    // This function is kept for compatibility but doesn't update local state
    console.log(`Status change for client ${clientId} to ${newStatus}`);
  };

  const handleCopyPhone = async (client: Client) => {
    toast.dismiss();
    const phoneNumber = `${client.phoneCode} ${client.phone}`;
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopiedPhoneId(client.id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
      toast.success("Phone number copied!");
    } catch (error) {
      console.error("Failed to copy phone number:", error);
      toast.error("Failed to copy phone number");
    }
  };

  const handleCopyEmail = async (client: Client) => {
    toast.dismiss();
    try {
      await navigator.clipboard.writeText(client.email);
      setCopiedEmailId(client.id);
      setTimeout(() => setCopiedEmailId(null), 2000);
      toast.success("Email copied!");
    } catch (error) {
      console.error("Failed to copy email:", error);
      toast.error("Failed to copy email");
    }
  };

  const handleRowClick = (clientId: string) => {
    router.push(`/admin/clients/${clientId}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <TooltipProvider>
      <div className="bg-white">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                Name
              </th>
              <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                Added On
              </th>
              <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                Current Plan
              </th>
              <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                Plan Status
              </th>
              <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                Referred By
              </th>
              <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                Status
              </th>
              <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {externalLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 ">
                  Loading...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 ">
                  No clients found
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr 
                  key={client.id} 
                  className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleRowClick(client.id)}
                >
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900 mb-1 ">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="flex gap-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                handleActionClick(e);
                                handleCopyPhone(client);
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {copiedPhoneId === client.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Phone className="w-3 h-3 text-gray-500 hover:text-blue-600 transition-colors" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {copiedPhoneId === client.id
                                ? "Phone number copied!"
                                : `${client.phoneCode} ${client.phone}`}
                            </p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                handleActionClick(e);
                                handleCopyEmail(client);
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {copiedEmailId === client.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Mail className="w-3 h-3 text-gray-500 hover:text-blue-600 transition-colors" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {copiedEmailId === client.id
                                ? "Email copied!"
                                : `${client.email}`}
                            </p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={handleActionClick}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Link className="w-3 h-3 text-gray-500 hover:text-blue-600 transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-900 whitespace-nowrap">{client.addedOn}</td>
                  <td className="py-4 px-6 text-gray-900 whitespace-nowrap">
                    {client.currentPlan}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="text-green-600 font-medium ">Active</span>
                  </td>
                  <td className="py-4 px-6 text-gray-900 whitespace-nowrap">
                    {client.referredBy}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap" onClick={handleActionClick}>
                    <ClientStatusSelect
                      clientId={client.id}
                      currentStatus={client.status}
                      onStatusChange={handleStatusChange}
                    />
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap" onClick={handleActionClick}>
                    <Button
                      variant="outline"
                      className="bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200 h-8 px-3 text-sm "
                    >
                      Spoof
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="mt-4">
            <ClientsPagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
