"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Loader2 } from "lucide-react";

interface FilterState {
  addedDate: string;
  status: string;
  subscriptionPlan: string;
  search: string;
  sortBy: string;
  sortOrder: string;
}

interface ClientsFilterProps {
  onFilterChange: (filters: FilterState) => void;
  onSearch: (searchTerm: string) => void;
  onClear: () => void;
  initialFilters?: Partial<FilterState>;
  isSearching?: boolean;
}

export function ClientsFilter({ 
  onFilterChange, 
  onSearch, 
  onClear, 
  initialFilters = {},
  isSearching = false
}: ClientsFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    addedDate: "all",
    status: "all",
    subscriptionPlan: "all",
    search: "",
    sortBy: "addedOn",
    sortOrder: "desc",
    ...initialFilters
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    onSearch(searchTerm);
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
    onClear();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Side - Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Added Date Filter */}
            <Select
              value={filters.addedDate}
              onValueChange={(value) => handleFilterChange("addedDate", value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Added Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Subscription Plan Filter */}
            <Select
              value={filters.subscriptionPlan}
              onValueChange={(value) => handleFilterChange("subscriptionPlan", value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Subscription Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="premium-done-for-you">Premium (Done For You)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Side - Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            )}
            <Input
              type="text"
              placeholder="Search"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className={`pl-10 w-64 ${isSearching ? 'border-blue-300' : ''}`}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleClear}
            className="bg-black text-white border-black hover:bg-gray-800"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Sort Information */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>OrderBy:</span>
          <span className="font-medium">{filters.sortBy === "addedOn" ? "Added On" : filters.sortBy}</span>
          <span>Order:</span>
          <span className="font-medium capitalize">{filters.sortOrder === "desc" ? "Descending" : "Ascending"}</span>
        </div>
      </div>
    </div>
  );
}
