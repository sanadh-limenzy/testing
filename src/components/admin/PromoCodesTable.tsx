"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PromoCodesPagination } from "./PromoCodesPagination";
import { DeletePromoCodeModal } from "./DeletePromoCodeModal";
import { PromoCodeDatabase } from "@/@types";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

type PromoCode = PromoCodeDatabase & {
  formatted_start_date: string;
  formatted_end_date: string;
  promo_code_allowed_plans?: {
    id: string;
    plan_id: string;
    plans: {
      id: string;
      plan_type: string;
      title: string;
    };
  }[];
};

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PromoCodesTableProps {
  initialPromoCodes: PromoCode[];
  initialPagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function PromoCodesTable({
  initialPromoCodes,
  initialPagination,
  onPageChange,
  loading: externalLoading = false,
}: PromoCodesTableProps) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [promoCodeToDelete, setPromoCodeToDelete] = useState<PromoCode | null>(
    null
  );

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(code);
      toast.success("Promo code copied to clipboard!");
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (error) {
      console.error("Failed to copy promo code:", error);
      toast.error("Failed to copy promo code");
    }
  };

  const handleDeleteClick = (promoCode: PromoCode) => {
    setPromoCodeToDelete(promoCode);
    setDeleteModalOpen(true);
  };

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
    setPromoCodeToDelete(null);
  };

  const formatDiscount = (
    isFlatDiscount: boolean,
    discountAmount?: number | null,
    discountPercent?: number | null
  ) => {
    if (isFlatDiscount && discountAmount) {
      return `$${discountAmount}`;
    }
    if (!isFlatDiscount && discountPercent) {
      return `${discountPercent}%`;
    }
    return "N/A";
  };

  const getStatusBadge = (
    isActive: boolean | null,
    expireAt: string | Date | null | undefined
  ) => {
    const now = new Date();
    const end = expireAt ? new Date(expireAt) : null;

    if (!isActive) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          Inactive
        </Badge>
      );
    }

    if (end && end < now) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-600">
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-green-100 text-green-600">
        Active
      </Badge>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Promo Code
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Start
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              End
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Code
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Discount
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Usage
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Status
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap w-fit">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {externalLoading ? (
            <tr>
              <td colSpan={9} className="py-8 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : initialPromoCodes.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-8 text-center text-gray-500">
                No promo codes found
              </td>
            </tr>
          ) : (
            initialPromoCodes.map((promoCode) => (
              <tr
                key={promoCode.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {/* Promo Code Name */}
                <td className="py-4 px-6">
                  <div className="font-medium text-gray-900">
                    {promoCode.name}
                  </div>
                </td>

                {/* Start Date */}
                <td className="py-4 px-6 text-gray-900 whitespace-nowrap">
                  {promoCode.formatted_start_date}
                </td>

                {/* End Date */}
                <td className="py-4 px-6 text-gray-900 whitespace-nowrap">
                  {promoCode.formatted_end_date}
                </td>

                {/* Code */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleCopyCode(promoCode.code || "")}
                          className="font-mono text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {promoCode.code || "N/A"}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {copiedCodeId === (promoCode.code || "")
                            ? "Code copied!"
                            : "Copy promo code"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </td>

                {/* Discount */}
                <td className="py-4 px-6">
                  <div className="text-gray-900 font-medium">
                    {formatDiscount(
                      promoCode.is_flat_discount || false,
                      promoCode.discount_amount,
                      promoCode.discount_percent
                    )}
                  </div>
                </td>

                {/* Usage */}
                <td className="py-4 px-6">
                  <div className="text-gray-900">
                    {promoCode.used_by_count || 0}
                    {promoCode.no_of_promo_allow_to_used &&
                      ` / ${promoCode.no_of_promo_allow_to_used}`}
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-6 whitespace-nowrap">
                  {getStatusBadge(
                    promoCode.is_active || false,
                    promoCode.expire_at
                  )}
                </td>

                {/* Action */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {/* One time use per person indicator */}
                    {promoCode.is_one_time_user && (
                      <div className="text-orange-600 text-xs font-medium">
                        One time use per person
                      </div>
                    )}

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCopyCode(promoCode.code || "")}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Copy Code
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            /* Handle edit */
                          }}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(promoCode)}
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {initialPagination.totalPages > 1 && (
        <PromoCodesPagination
          currentPage={initialPagination.page}
          totalPages={initialPagination.totalPages}
          onPageChange={onPageChange}
          hasNextPage={initialPagination.hasNextPage}
          hasPreviousPage={initialPagination.hasPreviousPage}
        />
      )}

      {/* Delete Modal */}
      {promoCodeToDelete && (
        <DeletePromoCodeModal
          isOpen={deleteModalOpen}
          onClose={handleDeleteModalClose}
          promoCode={{
            id: promoCodeToDelete.id,
            name: promoCodeToDelete.name || "Unnamed",
            code: promoCodeToDelete.code || "",
            used_by_count: promoCodeToDelete.used_by_count || 0,
          }}
        />
      )}
    </div>
  );
}
