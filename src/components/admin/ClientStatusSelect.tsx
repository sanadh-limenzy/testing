"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientStatusSelectProps {
  clientId: string;
  currentStatus: "active" | "inactive";
  onStatusChange?: (clientId: string, newStatus: "active" | "inactive") => void;
}

export function ClientStatusSelect({ 
  clientId, 
  currentStatus, 
  onStatusChange 
}: ClientStatusSelectProps) {
  const [status, setStatus] = useState<"active" | "inactive">(currentStatus);

  const handleStatusChange = async (newStatus: "active" | "inactive") => {
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: clientId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setStatus(newStatus);
        if (onStatusChange) {
          onStatusChange(clientId, newStatus);
        }
      } else {
        console.error('Failed to update user status');
        // Optionally show a toast notification here
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      // Optionally show a toast notification here
    }
  };

  return (
    <Select 
      value={status} 
      onValueChange={handleStatusChange}
    >
      <SelectTrigger className="w-24 h-8 bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200 font-eb-garamond">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active" className="font-eb-garamond">Active</SelectItem>
        <SelectItem value="inactive" className="font-eb-garamond">Inactive</SelectItem>
      </SelectContent>
    </Select>
  );
}
