"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TeamMemberStatusSelectProps {
  teamMemberId: string;
  currentStatus: "active" | "inactive";
  onStatusChange: (teamMemberId: string, newStatus: "active" | "inactive") => void;
}

export function TeamMemberStatusSelect({
  teamMemberId,
  currentStatus,
  onStatusChange,
}: TeamMemberStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: "active" | "inactive") => {
    if (newStatus === status) return;

    setIsUpdating(true);
    try {
      // Here you would typically make an API call to update the status
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStatus(newStatus);
      onStatusChange(teamMemberId, newStatus);
      toast.success(`Team member status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update team member status:", error);
      toast.error("Failed to update team member status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select
      value={status}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className={`w-24 h-8 text-xs ${
        status === "active" 
          ? "border-green-300 bg-green-50" 
          : "border-red-300 bg-red-50"
      }`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
      </SelectContent>
    </Select>
  );
}

