"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Calendar,
  DollarSign,
  TrendingUp,
  Building,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Residence, Comp } from "@/@types/custom-plans";

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
  const [showComps, setShowComps] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const toggleCompsDisplay = () => {
    setShowComps(!showComps);
  };

  const activeComps = residence.comps?.filter(comp => comp.is_active) || [];
  const hasComps = activeComps.length > 0;

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-gray-500" />
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {residence.nick_name || 'Unnamed Residence'}
              </h3>
              <p className="text-sm text-gray-500">
                Created {formatDate(residence.created_at)}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="h-8 px-2"
              title="Edit Residence"
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewComps}
              className="h-8 px-2"
              title="View Comps"
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="h-8 px-2"
              title="Delete Residence"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Financial Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Financial Details
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">TAR Fee Amount:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(residence.tar_fee_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">TAR Fee %:</span>
                <span className="font-medium">
                  {formatPercentage(residence.tar_fee_percent)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tax Savings:</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(residence.tax_savings)}
                </span>
              </div>
            </div>
          </div>

          {/* Property Valuation */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Property Valuation
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Value:</span>
                <span className="font-medium">
                  {formatCurrency(residence.average_value)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Value:</span>
                <span className="font-semibold">
                  {formatCurrency(residence.total_value)}
                </span>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Event Details
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Event Days:</span>
                <Badge variant="outline" className="text-xs">
                  {residence.event_days} days
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Comps:</span>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={hasComps ? "default" : "outline"} 
                    className="text-xs"
                  >
                    {activeComps.length} active
                  </Badge>
                  {hasComps && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleCompsDisplay}
                      className="h-6 w-6 p-0"
                    >
                      {showComps ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comps Section */}
        {hasComps && showComps && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Building className="w-4 h-4" />
                Comparable Properties ({activeComps.length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddComp}
                className="text-xs"
              >
                Add Comp
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeComps.map((comp) => (
                <CompCard key={comp.id} comp={comp} />
              ))}
            </div>
          </div>
        )}

        {/* Add Comp Button for empty state */}
        {!hasComps && (
          <div className="border-t border-gray-200 pt-4">
            <div className="text-center py-4">
              <Building className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500 mb-2">No comparable properties</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddComp}
                className="text-xs"
              >
                Add First Comp
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Comp Card Sub-component
interface CompCardProps {
  comp: Comp;
}

function CompCard({ comp }: CompCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatSquareFootage = (sqft: number) => {
    return `${sqft.toLocaleString()} sq ft`;
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="font-medium text-gray-700">Location</span>
          </div>
          <p className="text-gray-600 text-xs">{comp.location}</p>
          <p className="text-gray-500 text-xs">{comp.distance_from_residence}</p>
        </div>
        
        <div>
          <div className="font-medium text-gray-700 mb-1">Daily Rate</div>
          <p className="text-green-600 font-semibold">
            {formatCurrency(comp.daily_rental_amount)}
          </p>
        </div>
        
        <div>
          <div className="font-medium text-gray-700 mb-1">Property Details</div>
          <p className="text-gray-600 text-xs">
            {formatSquareFootage(comp.square_footage)}
          </p>
          {(comp.bedrooms || comp.bathrooms) && (
            <p className="text-gray-600 text-xs">
              {comp.bedrooms && `${comp.bedrooms} bed`}
              {comp.bedrooms && comp.bathrooms && ' • '}
              {comp.bathrooms && `${comp.bathrooms} bath`}
            </p>
          )}
        </div>
        
        <div>
          <div className="font-medium text-gray-700 mb-1">Actions</div>
          <div className="flex gap-1">
            {comp.website_link && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => window.open(comp.website_link!, '_blank')}
              >
                View
              </Button>
            )}
            {comp.notes && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                title={comp.notes}
              >
                Notes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}