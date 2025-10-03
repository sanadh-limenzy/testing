"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TransactionsFilter } from "@/components/admin/TransactionsFilter";
import { TransactionsTable } from "@/components/admin/TransactionsTable";
import { TransactionDatabase } from "@/@types";
import { UserProfile } from "@/@types/user";

type Transaction = TransactionDatabase & {
  user_profile: Pick<UserProfile, "id" | "first_name" | "last_name" | "email">;
  formatted_date: string;
};

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface TransactionsData {
  success: boolean;
  data: Transaction[];
  users: User[];
  pagination: PaginationInfo;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface FilterState {
  client: string;
  status: string;
  search: string;
}

interface TransactionsPageClientProps {
  initialTransactions: Transaction[];
  initialPagination: PaginationInfo;
  initialUsers: User[];
}

export function TransactionsPageClient({
  initialTransactions,
  initialPagination,
  initialUsers,
}: TransactionsPageClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    client: "all",
    status: "all",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Debug: Monitor query key changes
  useEffect(() => {
    console.log("Transaction query key changed:", { currentPage, filters });
  }, [currentPage, filters]);

  // Fetch transactions data
  const {
    data: transactionsData,
    isLoading,
    error,
    refetch,
  } = useQuery<TransactionsData>({
    queryKey: ["transactions", currentPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "15",
        client: filters.client,
        status: filters.status,
        search: filters.search,
      });

      console.log(
        "Making transactions API call with params:",
        Object.fromEntries(params)
      );
      const response = await fetch(`/api/admin/transactions?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json();
    },
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    staleTime: 0, // Always consider data stale to allow refetching
  });

  const handleFilterChange = (newFilters: FilterState) => {
    console.log("Transaction filter change triggered:", newFilters);
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClear = () => {
    setFilters({
      client: "all",
      status: "all",
      search: "",
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefund = async (transactionId: string, reason: string) => {
    try {
      const response = await fetch(
        `/api/admin/transactions/${transactionId}/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refund transaction");
      }

      // Refetch data after successful refund
      refetch();
    } catch (error) {
      console.error("Error refunding transaction:", error);
    }
  };

  const transactions = transactionsData?.data || initialTransactions;
  const pagination = transactionsData?.pagination || initialPagination;
  const users = transactionsData?.users || initialUsers;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading transactions: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">
          Manage and monitor all transaction activities
        </p>
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <TransactionsFilter
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClear}
          initialFilters={filters}
          isSearching={isLoading}
          users={users}
        />

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-xs">
          <TransactionsTable
            initialTransactions={transactions}
            initialPagination={pagination}
            onPageChange={handlePageChange}
            onRefund={handleRefund}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
