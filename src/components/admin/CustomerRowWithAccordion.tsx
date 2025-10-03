"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Home, Plus } from "lucide-react";
import { CustomPlanWithDetails } from "@/@types/custom-plans";
import { ResidenceCard } from "./ResidenceCard";

interface CustomerRowWithAccordionProps {
  plan: CustomPlanWithDetails;
  onViewClick?: (planId: string) => void;
  onAddResidenceClick?: (planId: string) => void;
  onEditResidence?: (residenceId: string) => void;
  onDeleteResidence?: (residenceId: string) => void;
  onViewComps?: (residenceId: string) => void;
  onAddComp?: (residenceId: string) => void;
}

export function CustomerRowWithAccordion({
  plan,
  onViewClick,
  onAddResidenceClick,
  onEditResidence,
  onDeleteResidence,
  onViewComps,
  onAddComp,
}: CustomerRowWithAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: "ACTIVE" | "INACTIVE" | null) => {
    const isActive = status === "ACTIVE";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Use residence data that's already available in the plan object
  const residences = plan.residences || [];
  const hasResidenceData = residences.length > 0;

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewClick?.(plan.id);
  };

  const handleAddResidenceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddResidenceClick?.(plan.id);
  };

  return (
    <div className="border-b border-gray-200">
      {/* Main Row */}
      <div
        className={"px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer" + (isExpanded ? " bg-gray-50" : "")}
        onClick={handleToggleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Left Side - Customer Info */}
          <div className="flex items-center gap-3"> 
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isExpanded ? "rotate-0" : "-rotate-90"
              }`}
            />
            <div>
              <div className="font-medium text-gray-900 text-lg">
                {plan.user_profile?.first_name} {plan.user_profile?.last_name}
              </div>
              <div className="text-sm text-gray-600">
                {plan.user_profile?.email}
              </div>
            </div>
          </div>

          {/* Center - Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Home className="w-4 h-4" />
              <span>{plan.residence_count || plan.residences.length} Residence(s)</span>
            </div>
            <div>{getStatusBadge(plan.status)}</div>
            <div className="text-sm text-gray-600">
              {formatDate(plan.created_at)}
            </div>
            <div className="font-medium text-gray-900">
              {formatCurrency(plan.total_tar_amount)}
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={handleViewClick}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-6 bg-gray-50 border-t">
          <div className="pl-6">
            {/* Residences Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                Residences
              </h4>
              <Button
                variant="default"
                size="sm"
                onClick={handleAddResidenceClick}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-3 h-3" />
                Add Residence
              </Button>
            </div>
            
            {/* Residence Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {hasResidenceData ? (
                residences.map((residence) => (
                  <ResidenceCard
                    key={residence.id}
                    residence={residence}
                    onEdit={onEditResidence}
                    onDelete={onDeleteResidence}
                    onViewComps={onViewComps}
                    onAddComp={onAddComp}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No residences found</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Click &quot;Add Residence&quot; to get started
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddResidenceClick}
                    className="flex items-center gap-1 mx-auto"
                  >
                    <Plus className="w-3 h-3" />
                    Add Residence
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
