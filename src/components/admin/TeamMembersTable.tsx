"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { TeamMemberStatusSelect } from "./TeamMemberStatusSelect";
import { TeamMembersPagination } from "./TeamMembersPagination";

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
  permissionLevel: "Super Admin" | "Admin" | "Employee" | "Subscriber";
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

interface TeamMembersTableProps {
  initialTeamMembers: TeamMember[];
  initialPagination: PaginationInfo;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

export function TeamMembersTable({
  initialTeamMembers,
  initialPagination,
  onPageChange,
  loading: externalLoading = false,
}: TeamMembersTableProps) {
  const router = useRouter();
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Use the data passed from parent instead of internal state
  const teamMembers = initialTeamMembers;
  const pagination = initialPagination;

  const handlePageChange = (page: number) => {
    if (externalLoading) return;

    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleStatusChange = (
    teamMemberId: string,
    newStatus: "active" | "inactive"
  ) => {
    // Status changes are now handled by React Query mutations
    // This function is kept for compatibility but doesn't update local state
    console.log(
      `Status change for team member ${teamMemberId} to ${newStatus}`
    );
  };

  const handleCopyEmail = async (teamMember: TeamMember) => {
    toast.dismiss();
    try {
      await navigator.clipboard.writeText(teamMember.email);
      setCopiedEmailId(teamMember.id);
      setTimeout(() => setCopiedEmailId(null), 2000);
      toast.success("Email copied!");
    } catch (error) {
      console.error("Failed to copy email:", error);
      toast.error("Failed to copy email");
    }
  };

  const handleRowClick = (teamMemberId: string) => {
    router.push(`/admin/team-members/${teamMemberId}`);
  };

  return (
    <TooltipProvider>
      <div className="bg-white">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                  Name
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                  Email
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                  Permission Level
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {externalLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 ">
                    Loading...
                  </td>
                </tr>
              ) : teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 ">
                    No team members found
                  </td>
                </tr>
              ) : (
                teamMembers.map((teamMember) => (
                  <tr
                    key={teamMember.id}
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleRowClick(teamMember.id)}
                  >
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">
                        {teamMember.firstName} {teamMember.lastName}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">
                          {teamMember.email}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyEmail(teamMember);
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {copiedEmailId === teamMember.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Mail className="w-3 h-3 text-gray-500 hover:text-blue-600 transition-colors" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {copiedEmailId === teamMember.id
                                ? "Email copied!"
                                : "Copy email"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          teamMember.permissionLevel === "Super Admin"
                            ? "bg-red-100 text-red-800"
                            : teamMember.permissionLevel === "Admin"
                            ? "bg-yellow-100 text-yellow-800"
                            : teamMember.permissionLevel === "Employee"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {teamMember.permissionLevel}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <TeamMemberStatusSelect
                        teamMemberId={teamMember.id}
                        currentStatus={teamMember.status}
                        onStatusChange={handleStatusChange}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="mt-4">
            <TeamMembersPagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
