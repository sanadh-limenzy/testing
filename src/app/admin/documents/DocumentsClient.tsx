"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VirtualizedSelect } from "@/components/ui/virtualized-select";
import { Input } from "@/components/ui/input";
import { FileText, Filter, Search } from "lucide-react";

interface Document {
  id: string;
  name: string;
  eventName: string;
  eventId: string;
  userId: string;
  userName: string;
  type: "supportive" | "rental_agreement" | "reimbursement_plan" | "invoice";
  url?: string;
  createdAt: string;
  isSigned?: boolean;
}

interface User {
  id: string;
  name: string;
}

interface DocumentsClientProps {
  initialDocuments: Document[];
  users: User[];
  initialYear?: string; // Not used - we read from searchParams instead
  initialUserId?: string; // Not used - we read from searchParams instead
  initialSearch?: string;
}

function getDocumentTypeLabel(type: Document["type"]) {
  switch (type) {
    case "supportive":
      return "Supportive Documents";
    case "rental_agreement":
      return "Rental Agreement";
    case "reimbursement_plan":
      return "Reimbursement Plan";
    case "invoice":
      return "Invoice";
    default:
      return "Document";
  }
}

// Get unique years from documents
function getAvailableYears(documents: Document[]): string[] {
  const years = new Set<string>();
  documents.forEach((doc) => {
    const year = new Date(doc.createdAt).getFullYear().toString();
    years.add(year);
  });
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export default function DocumentsClient({
  initialDocuments,
  users,
  initialSearch,
}: DocumentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch || "");

  const availableYears = getAvailableYears(initialDocuments);

  // Get current filter values from URL params (for reactive filtering)
  const currentYear = searchParams.get("year") || "all";
  const currentUserId = searchParams.get("userId") || "all";

  // Prepare user options for virtualized select
  const userOptions = useMemo(() => {
    return [
      { value: "all", label: "All Users" },
      ...users.map((user) => ({
        value: user.id,
        label: user.name,
      })),
    ];
  }, [users]);


  // Filter documents based on current filters
  const filteredDocuments = initialDocuments.filter((doc) => {
    const matchesYear = currentYear && currentYear !== "all"
      ? new Date(doc.createdAt).getFullYear().toString() === currentYear
      : true;
    const matchesUser = currentUserId && currentUserId !== "all"
      ? doc.userId === currentUserId
      : true;
    const matchesSearch = searchTerm
      ? doc.eventName.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesYear && matchesUser && matchesSearch;
  });

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (year && year !== "all") {
      params.set("year", year);
    } else {
      params.delete("year");
    }
    router.push(`/admin/documents?${params.toString()}`);
  };

  const handleUserChange = (userId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (userId && userId !== "all") {
      params.set("userId", userId);
    } else {
      params.delete("userId");
    }
    router.push(`/admin/documents?${params.toString()}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    router.push(`/admin/documents?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchTerm("");
    router.push("/admin/documents");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Filter Label - Mobile & Tablet */}
        <div className="flex items-center gap-2 md:hidden">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Filters
          </span>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          {/* Filter Label - Desktop */}
          <div className="hidden md:flex items-end gap-2 pb-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Filters
            </span>
          </div>

          {/* Added Date Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Added Date</label>
            <Select
              value={currentYear}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="bg-muted w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Filter - Virtualized */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">User</label>
            <VirtualizedSelect
              value={currentUserId}
              onValueChange={handleUserChange}
              options={userOptions}
              placeholder="Select user"
              searchPlaceholder="Search users..."
              emptyMessage="No users found"
            />
          </div>

          {/* Search Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Search By Event Name</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleClear}
                className="px-4 md:px-6 shrink-0"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold min-w-[150px]">Event Name</TableHead>
                    <TableHead className="font-bold min-w-[180px]">Document Type</TableHead>
                    <TableHead className="font-bold min-w-[140px]">Client Name</TableHead>
                    <TableHead className="font-bold text-right min-w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-[180px] md:max-w-none truncate">
                          {doc.eventName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap">
                          {getDocumentTypeLabel(doc.type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/clients/${doc.userId}`}
                          className="text-primary hover:underline whitespace-nowrap"
                        >
                          {doc.userName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        {doc.url ? (
                          <Link href={doc.url} target="_blank">
                            <Button
                              size="sm"
                              className="bg-[#0e5e7e] hover:bg-[#0d5270] text-white whitespace-nowrap"
                            >
                              View
                            </Button>
                          </Link>
                        ) : (
                          <Button size="sm" disabled variant="outline" className="whitespace-nowrap">
                            No Document
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {filteredDocuments.length} of {initialDocuments.length} documents
      </div>
    </div>
  );
}

