"use client";

import { useState, useMemo } from "react";
import { useCustomPlans } from "@/hooks/useCustomPlans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Loader2, Home, Plus, AlertCircle } from "lucide-react";
import {
  CustomPlanWithDetails,
  PaginationInfo,
  FilterStatus,
} from "@/@types/custom-plans";
import { CustomerRowWithAccordion } from "@/components/admin/CustomerRowWithAccordion";

interface FilterState {
  search: string;
  status: FilterStatus;
}

interface AllPlansPageClientProps {
  initialCustomPlans?: CustomPlanWithDetails[];
  initialPagination?: PaginationInfo;
}

export function AllPlansPageClient({
  initialCustomPlans = [],
  initialPagination,
}: AllPlansPageClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(
    () => ({
      search: filters.search,
      status: filters.status,
    }),
    [filters.search, filters.status]
  );

  // Use the custom hook for data fetching
  const {
    data: customPlansResponse,
    isLoading,
    error,
    isError,
    refetch,
  } = useCustomPlans({
    page: currentPage,
    filters: memoizedFilters,
    enabled: true,
  });

  // Extract data from response
  const customPlans = customPlansResponse?.data || initialCustomPlans;
  const pagination = customPlansResponse?.pagination ||
    initialPagination || {
      page: 1,
      limit: 15,
      totalCount: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (searchTerm: string) => {
    setFilters((prev) => ({ ...prev, search: searchTerm }));
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleClear = () => {
    const clearedFilters = {
      search: "",
      status: "all" as const,
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRetry = () => {
    refetch();
  };

  // Action handlers for CustomerRowWithAccordion
  const handleViewClick = (planId: string) => {
    // TODO: Navigate to plan detail page
    console.log("View plan:", planId);
  };

  const handleAddResidenceClick = (planId: string) => {
    // TODO: Navigate to add residence page
    console.log("Add residence for plan:", planId);
  };

  const handleEditResidence = (residenceId: string) => {
    // TODO: Navigate to edit residence page
    console.log("Edit residence:", residenceId);
  };

  const handleDeleteResidence = (residenceId: string) => {
    // TODO: Handle residence deletion
    console.log("Delete residence:", residenceId);
  };

  const handleViewComps = (residenceId: string) => {
    // TODO: Navigate to view comps page
    console.log("View comps for residence:", residenceId);
  };

  const handleAddComp = (residenceId: string) => {
    // TODO: Navigate to add comp page
    console.log("Add comp for residence:", residenceId);
  };

  // Error state
  if (isError && !isLoading) {
    return (
      <div className="min-h-screen bg-white p-8 font-medium">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <AlertCircle className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Error Loading Custom Plans
            </h2>
            <p className="text-gray-600 mb-6">
              {error?.message ||
                "An unexpected error occurred while loading custom plans."}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleRetry}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 font-medium">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 font-eb-garamond">
                Custom Plans
              </h1>
              {isLoading && (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              )}
            </div>
            <p className="text-gray-600 mt-2 font-eb-garamond">
              Total: {pagination.totalCount} plans
            </p>
          </div>
          <Button className="w-full sm:w-auto" disabled={isLoading}>
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </Button>
        </div>

        {/* Filter Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Filters Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Filters:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onValueChange={(value: FilterStatus) =>
                    handleFilterChange("status", value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search and Actions Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                {isLoading ? (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                )}
                <Input
                  type="text"
                  placeholder="Search by customer name or email..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`pl-10 w-full ${
                    isLoading ? "border-blue-300" : ""
                  }`}
                  disabled={isLoading}
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleClear}
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Custom Plans List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden relative">
          {/* Loading Overlay */}
          {isLoading && customPlans.length > 0 && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-gray-700">
                  Updating...
                </span>
              </div>
            </div>
          )}

          {/* Plans List */}
          <div>
            {isLoading ? (
              // Loading skeleton
              <div className="p-6">
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          <div>
                            <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-48"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : customPlans.length === 0 ? (
              // Empty state
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Home className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filters.search || filters.status !== "all"
                    ? "No matching custom plans found"
                    : "No custom plans found"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {filters.search || filters.status !== "all"
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Get started by creating your first custom plan."}
                </p>
                {(filters.search || filters.status !== "all") && (
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              // Accordion rows with CustomerRowWithAccordion components
              customPlans.map((plan) => (
                <CustomerRowWithAccordion
                  key={plan.id}
                  plan={plan}
                  onViewClick={handleViewClick}
                  onAddResidenceClick={handleAddResidenceClick}
                  onEditResidence={handleEditResidence}
                  onDeleteResidence={handleDeleteResidence}
                  onViewComps={handleViewComps}
                  onAddComp={handleAddComp}
                />
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(currentPage * pagination.limit, pagination.totalCount)}{" "}
              of {pagination.totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPreviousPage || isLoading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
