"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PromoCodesTable } from "@/components/admin/PromoCodesTable";
import { PromoCodeDatabase } from "@/@types";
import { usePromoCodes } from "@/hooks/usePromoCodes";

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

interface PromoCodesPageClientProps {
  initialPromoCodes: PromoCode[];
  initialPagination: PaginationInfo;
}

export function PromoCodesPageClient({
  initialPromoCodes,
  initialPagination,
}: PromoCodesPageClientProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch promo codes data
  const {
    data: promoCodesData,
    isLoading,
    error,
  } = usePromoCodes({
    page: currentPage,
    limit: 15,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  const promoCodes = promoCodesData?.data || initialPromoCodes;
  const pagination = promoCodesData?.pagination || initialPagination;

  if (error) {
    toast.error(`Error loading promo codes: ${error.message}`);
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading promo codes: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor all promotional codes
          </p>
        </div>
        <Link 
          href="/admin/promo-code/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          + Add
        </Link>
      </div>

      <div className="space-y-6">
        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-xs">
          <PromoCodesTable
            initialPromoCodes={promoCodes}
            initialPagination={pagination}
            onPageChange={handlePageChange}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
