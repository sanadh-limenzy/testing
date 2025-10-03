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
import { Search, X } from "lucide-react";

interface FilterState {
  status: string;
  search: string;
}

interface PromoCodesFilterProps {
  onFilterChange: (filters: FilterState) => void;
  onSearch: (search: string) => void;
  onClear: () => void;
  initialFilters: FilterState;
  isSearching?: boolean;
}

export function PromoCodesFilter({
  onFilterChange,
  onSearch,
  onClear,
  initialFilters,
  isSearching = false,
}: PromoCodesFilterProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [searchValue, setSearchValue] = useState(initialFilters.search);

  const handleStatusChange = (status: string) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const handleClear = () => {
    setFilters({ status: "all", search: "" });
    setSearchValue("");
    onClear();
  };

  const hasActiveFilters = filters.status !== "all" || filters.search !== "";

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search promo codes..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4"
              disabled={isSearching}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-48">
          <Select
            value={filters.status}
            onValueChange={handleStatusChange}
            disabled={isSearching}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isSearching}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
