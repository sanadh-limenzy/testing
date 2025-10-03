"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TeamMembersFilter } from "@/components/admin/TeamMembersFilter";
import { TeamMembersTable } from "@/components/admin/TeamMembersTable";

interface TeamMember {
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
  permissionLevel: "Super Admin" | "Full Access" | "Limited Access";
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

interface TeamMembersPageClientProps {
  initialTeamMembers: TeamMember[];
  initialPagination: PaginationInfo;
}

export function TeamMembersPageClient({
  initialTeamMembers,
  initialPagination,
}: TeamMembersPageClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    addedDate: "all",
    status: "all",
    accessLevel: "all",
    search: "",
    sortBy: "addedOn",
    sortOrder: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Debug: Monitor query key changes
  useEffect(() => {
    console.log("Query key changed:", { currentPage, filters });
  }, [currentPage, filters]);

  // Fetch team members data
  const {
    data: teamMembersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teamMembers", currentPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "15",
        addedDate: filters.addedDate,
        status: filters.status,
        accessLevel: filters.accessLevel,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      console.log("Making API call with params:", Object.fromEntries(params));
      const response = await fetch(`/api/admin/team-members?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      return response.json();
    },
    placeholderData: {
      success: true,
      data: initialTeamMembers,
      pagination: initialPagination,
    },
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    staleTime: 0, // Always consider data stale to allow refetching
  });

  const handleFilterChange = (newFilters: FilterState) => {
    console.log("Filter change triggered:", newFilters);
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
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
              Error Loading Team Members
            </h2>
            <p className="text-gray-600 mb-4">
              There was an error loading the team members data. Please try
              again.
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
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all admin accounts
          </p>
        </div>

        {/* Filter */}
        <TeamMembersFilter
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClear}
          initialFilters={filters}
          isSearching={isLoading}
        />

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <TeamMembersTable
            initialTeamMembers={teamMembersData?.data || initialTeamMembers}
            initialPagination={teamMembersData?.pagination || initialPagination}
            onPageChange={handlePageChange}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
