"use client";

import { LucideIcon } from "lucide-react";

interface EmptyTabContentProps {
  icon: LucideIcon;
  message?: string;
}

export function EmptyTabContent({ icon: Icon, message = "No Result Found" }: EmptyTabContentProps) {
  return (
    <div className="bg-gray-100 rounded-lg p-8 md:p-16 text-center min-h-[400px] flex flex-col items-center justify-center">
      <Icon className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mb-4" />
      <p className="text-lg md:text-xl text-gray-600 font-medium">{message}</p>
    </div>
  );
}

