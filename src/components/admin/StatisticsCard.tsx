"use client";

import { Card } from "@/components/ui/card";

interface StatisticsCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export function StatisticsCard({ title, value, className = "" }: StatisticsCardProps) {
  return (
    <Card className={`p-8 shadow-sm border-gray-100 ${className}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-4xl font-bold text-gray-900">
          {value}
        </p>
      </div>
    </Card>
  );
}
