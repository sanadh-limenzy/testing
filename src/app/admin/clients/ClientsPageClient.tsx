"use client";

import { useState, useMemo, useEffect } from "react";
import { ClientsTable } from "@/components/admin/ClientsTable";
import { ClientsFilter } from "@/components/admin/ClientsFilter";
import { useClients } from "@/hooks/useClients";
import { useDebounce } from "@/hooks/useDebounce";

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

interface FilterState {
  addedDate: string;
  status: string;
  subscriptionPlan: string;
  search: string;
  sortBy: string;
  sortOrder: string;
}

interface ClientsPageClientProps {
  initialClients: Client[];
  initialPagination: PaginationInfo;
}

export function ClientsPageClient({ 
  initialClients, 
  initialPagination 
}: ClientsPageClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    addedDate: "all",
    status: "all",
    subscriptionPlan: "all",
    search: "",
    sortBy: "addedOn",
    sortOrder: "desc"
  });

  // Debounce the search term with 500ms delay
  const debouncedSearch = useDebounce(filters.search, 500);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch
  }), [filters, debouncedSearch]);

  const { 
    data: clientsData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useClients({ 
    page: currentPage, 
    filters: memoizedFilters 
  });

  const clients = clientsData?.data || initialClients;
  const pagination = clientsData?.pagination || initialPagination;
  const loading = isLoading;

  // Check if search is being debounced (user typed but debounced value hasn't updated yet)
  const isSearching = filters.search !== debouncedSearch;

  // Reset to first page when debounced search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);


  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (searchTerm: string) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    // Don't reset page here - the debounced effect will handle it
  };

  const handleClear = () => {
    const clearedFilters = {
      addedDate: "all",
      status: "all",
      subscriptionPlan: "all",
      search: "",
      sortBy: "addedOn",
      sortOrder: "desc"
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-white p-8 font-medium">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Clients</h2>
            <p className="text-gray-600 mb-6">
              {error?.message || "Something went wrong while loading the clients."}
            </p>
            <button
              onClick={() => refetch()}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 font-medium">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-eb-garamond">Clients</h1>
          <p className="text-gray-600 mt-2 font-eb-garamond">
            Total: {pagination.totalCount} clients
          </p>
        </div>

        {/* Filter Section */}
        <ClientsFilter
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClear}
          initialFilters={filters}
          isSearching={isSearching}
        />

        {/* Clients Table */}
        <ClientsTable 
          initialClients={clients}
          initialPagination={pagination}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>
    </div>
  );
}
