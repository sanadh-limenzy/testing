"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { TaxProStatusSelect } from "./TaxProStatusSelect";
import { TaxProsPagination } from "./TaxProsPagination";

interface TaxPro {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  addedOn: string;
  businessName?: string;
  businessEntityType?: string;
  status: "active" | "inactive";
  userType: "Admin" | "Subscriber" | "Accountant" | "Vendor";
  isActive: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface TaxProsTableProps {
  initialTaxPros: TaxPro[];
  initialPagination: PaginationInfo;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

export function TaxProsTable({
  initialTaxPros,
  initialPagination,
  onPageChange,
  loading: externalLoading = false,
}: TaxProsTableProps) {
  const router = useRouter();
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Use the data passed from parent instead of internal state
  const taxPros = initialTaxPros;
  const pagination = initialPagination;

  const handlePageChange = (page: number) => {
    if (externalLoading) return;

    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleStatusChange = (
    taxProId: string,
    newStatus: "active" | "inactive"
  ) => {
    // Status changes are now handled by React Query mutations
    // This function is kept for compatibility but doesn't update local state
    console.log(`Status change for tax pro ${taxProId} to ${newStatus}`);
  };

  const handleCopyPhone = async (taxPro: TaxPro) => {
    toast.dismiss();
    const phoneNumber = `${taxPro.phoneCode} ${taxPro.phone}`;
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopiedPhoneId(taxPro.id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
      toast.success("Phone number copied!");
    } catch (error) {
      console.error("Failed to copy phone number:", error);
      toast.error("Failed to copy phone number");
    }
  };

  const handleCopyEmail = async (taxPro: TaxPro) => {
    toast.dismiss();
    try {
      await navigator.clipboard.writeText(taxPro.email);
      setCopiedEmailId(taxPro.id);
      setTimeout(() => setCopiedEmailId(null), 2000);
      toast.success("Email copied!");
    } catch (error) {
      console.error("Failed to copy email:", error);
      toast.error("Failed to copy email");
    }
  };

  const handleRowClick = (taxProId: string) => {
    router.push(`/admin/taxpros/${taxProId}`);
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
                  Business Name
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                  Business Entity Type
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
                  <td colSpan={6} className="py-8 text-center text-gray-500 ">
                    Loading...
                  </td>
                </tr>
              ) : taxPros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 ">
                    No tax pros found
                  </td>
                </tr>
              ) : (
                taxPros.map((taxPro) => (
                  <tr
                    key={taxPro.id}
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleRowClick(taxPro.id)}
                  >
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900 mb-1 ">
                          {taxPro.firstName} {taxPro.lastName}
                        </div>
                        <div className="flex gap-3">
                          {taxPro.phone && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    handleActionClick(e);
                                    handleCopyPhone(taxPro);
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                  {copiedPhoneId === taxPro.id ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Phone className="w-3 h-3 text-gray-500 hover:text-blue-600 transition-colors" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {copiedPhoneId === taxPro.id
                                    ? "Phone number copied!"
                                    : `${taxPro.phoneCode} ${taxPro.phone}`}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  handleActionClick(e);
                                  handleCopyEmail(taxPro);
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                {copiedEmailId === taxPro.id ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Mail className="w-3 h-3 text-gray-500 hover:text-blue-600 transition-colors" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {copiedEmailId === taxPro.id
                                  ? "Email copied!"
                                  : `${taxPro.email}`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900 whitespace-nowrap">
                      {taxPro.addedOn}
                    </td>
                    <td className="py-4 px-6 text-gray-900 whitespace-nowrap">
                      {taxPro.businessName || "N/A"}
                    </td>
                    <td className="py-4 px-6 text-gray-900 whitespace-nowrap">
                      {taxPro.businessEntityType || "N/A"}
                    </td>
                    <td
                      className="py-4 px-6 whitespace-nowrap"
                      onClick={handleActionClick}
                    >
                      <TaxProStatusSelect
                        taxProId={taxPro.id}
                        currentStatus={taxPro.status}
                        onStatusChange={handleStatusChange}
                      />
                    </td>
                    <td
                      className="py-4 px-6 whitespace-nowrap"
                      onClick={handleActionClick}
                    >
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
            <TaxProsPagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
