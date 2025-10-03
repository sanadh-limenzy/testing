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
import { VirtualizedSelect } from "@/components/ui/virtualized-select";
import { Search, X } from "lucide-react";

interface FilterState {
  client: string;
  status: string;
  search: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface TransactionsFilterProps {
  onFilterChange: (filters: FilterState) => void;
  onSearch: (search: string) => void;
  onClear: () => void;
  initialFilters: FilterState;
  isSearching?: boolean;
  users: User[];
}

export function TransactionsFilter({
  onFilterChange,
  onSearch,
  onClear,
  initialFilters,
  isSearching = false,
  users,
}: TransactionsFilterProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [searchValue, setSearchValue] = useState(initialFilters.search);

  // Transform users into options for VirtualizedSelect
  const clientOptions = [
    { value: "all", label: "All Clients" },
    ...users.map((user) => ({
      value: user.id,
      label: `${user.first_name} ${user.last_name} (${user.email})`,
    })),
  ];

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const handleClear = () => {
    const clearedFilters = {
      client: "all",
      status: "all",
      search: "",
    };
    setFilters(clearedFilters);
    setSearchValue("");
    onClear();
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Filter Transactions
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="text-gray-600 hover:text-gray-900"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Select Client */}
        <div className="flex-1">
          <VirtualizedSelect
            value={filters.client}
            onValueChange={(value) => handleFilterChange("client", value)}
            options={clientOptions}
            placeholder="Select Client"
            searchPlaceholder="Search clients..."
            emptyMessage="No clients found"
            disabled={isSearching}
          />
        </div>

        {/* Select Transaction Status */}
        <div className="flex-1">
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Transaction Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search by Transaction ID */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by Transaction ID"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              disabled={isSearching}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
