"use client";

import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Eye, 
  MapPin,
  Plus
} from "lucide-react";
import { Residence } from "@/@types/custom-plans";

interface ResidenceCardProps {
  residence: Residence;
  onEdit?: (residenceId: string) => void;
  onDelete?: (residenceId: string) => void;
  onViewComps?: (residenceId: string) => void;
  onAddComp?: (residenceId: string) => void;
}

export function ResidenceCard({
  residence,
  onEdit,
  onDelete,
  onViewComps,
  onAddComp,
}: ResidenceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percent: number) => {
    return `${percent}%`;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(residence.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(residence.id);
  };

  const handleViewComps = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewComps?.(residence.id);
  };

  const handleAddComp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddComp?.(residence.id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 w-96 h-96">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {residence.nick_name || 'Residence Name'}
        </h3>
        <Badge className="bg-green-100 text-green-800 text-xs">
          Active
        </Badge>
      </div>

      {/* Address */}
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">
          {residence.address?.street && residence.address?.city && residence.address?.state && residence.address?.zip
            ? `${residence.address.street}, ${residence.address.city}, ${residence.address.state}, ${residence.address.zip}`
            : 'Address not specified'
          }
        </span>
      </div>

      {/* Details Section */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700">Event Days:</span>
          <span className="text-sm font-bold">{residence.event_days} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700">Average Value:</span>
          <span className="text-sm font-bold">{formatCurrency(residence.average_value)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700">TAR Fee:</span>
          <span className="text-sm font-bold">{formatPercentage(residence.tar_fee_percent)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700">Tax Savings:</span>
          <span className="text-sm font-bold">{formatCurrency(residence.tax_savings)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700">Total Value:</span>
          <span className="text-sm font-bold">{formatCurrency(residence.total_value)}</span>
        </div>
      </div>

      {/* Separator */}
      <hr className="border-gray-200 mb-4" />

      {/* TAR Amount */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-700">TAR Amount:</span>
        <span className="text-lg font-bold text-green-600">{formatCurrency(residence.tar_fee_amount)}</span>
      </div>

      {/* Action Icons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleViewComps}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="View Comps"
        >
          <Eye className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={handleAddComp}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Add Comp"
        >
          <Plus className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={handleEdit}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Edit"
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}