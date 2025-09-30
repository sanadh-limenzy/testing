"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TaxProsFilter } from "@/components/admin/TaxProsFilter";
import { TaxProsTable } from "@/components/admin/TaxProsTable";

interface TaxPro {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  addedOn: string;
  companyPosition?: string;
  isSuperAdmin: boolean;
  allowAllAccess: boolean;
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

interface FilterState {
  addedDate: string;
  status: string;
  accessLevel: string;
  search: string;
  sortBy: string;
  sortOrder: string;
}

interface TaxProsPageClientProps {
  initialTaxPros: TaxPro[];
  initialPagination: PaginationInfo;
}

export function TaxProsPageClient({
  initialTaxPros,
  initialPagination,
}: TaxProsPageClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    addedDate: "all",
    status: "all",
    accessLevel: "all",
    search: "",
    sortBy: "addedOn",
    sortOrder: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch tax pros data
  const {
    data: taxProsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["taxPros", currentPage, filters, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "15",
        addedDate: filters.addedDate,
        status: filters.status,
        accessLevel: filters.accessLevel,
        search: searchTerm,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const response = await fetch(`/api/admin/taxpros?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tax pros");
      }
      return response.json();
    },
    initialData: {
      success: true,
      data: initialTaxPros,
      pagination: initialPagination,
    },
  });

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClear = () => {
    setFilters({
      addedDate: "all",
      status: "all",
      accessLevel: "all",
      search: "",
      sortBy: "addedOn",
      sortOrder: "desc",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Tax Pros
            </h2>
            <p className="text-gray-600 mb-4">
              There was an error loading the tax pros data. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tax Pros</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all tax professional accounts
          </p>
        </div>

        {/* Filter */}
        <TaxProsFilter
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClear}
          initialFilters={filters}
          isSearching={isLoading}
        />

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <TaxProsTable
            initialTaxPros={taxProsData?.data || []}
            initialPagination={taxProsData?.pagination || initialPagination}
            onPageChange={handlePageChange}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
