"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TaxSavingsData {
  pastDeductions: number;
  number_of_event_days_used: number;
  totalEvents: number;
  remainingEvents: number;
  newEventDays: number;
  taxSavingsPercentage?: number;
  futureTaxSavingsPercentage?: number;
}

interface TaxDeductionsCardProps {
  taxSavingsData: TaxSavingsData;
  currentEventDeduction?: number | string | undefined;
  formatCurrencyValue?: (value: number) => string;
}

export const TaxDeductionsCard = React.memo(
  ({
    taxSavingsData,
    currentEventDeduction,
    formatCurrencyValue = (value: number) => {
      if (value >= 1000000000) {
        return `$${(value / 1000000000).toFixed(1)}B`;
      } else if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      } else {
        return `$${value.toLocaleString()}`;
      }
    },
  }: TaxDeductionsCardProps) => {
    const {
      pastDeductions,
      number_of_event_days_used,
      totalEvents,
      newEventDays,
      taxSavingsPercentage = 0,
      futureTaxSavingsPercentage = 100,
    } = taxSavingsData;

    const totalDeductions =
      pastDeductions +
      (currentEventDeduction ? Number(currentEventDeduction) : 0);
    const totalDaysUsed = number_of_event_days_used + newEventDays;

    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <h3 className="tax-title text-sm font-bold text-gray-500 tracking-wide">
              TAX DEDUCTIONS
            </h3>

            {/* Calculate tax deduction amounts */}
            <div className="amounts">
              <div className="amounts-header flex items-center justify-between mb-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">
                  {formatCurrencyValue(pastDeductions)} +{" "}
                  <span className="highlight text-blue-500">
                    {formatCurrencyValue(
                      currentEventDeduction ? Number(currentEventDeduction) : 0
                    )}
                  </span>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words text-right">
                  {formatCurrencyValue(totalDeductions)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-wrap">
              <div className="progress-bar w-full bg-gray-200 rounded-full h-3 mb-4 relative overflow-hidden">
                <div
                  className="progress-fill bg-green-500 h-3 rounded-full absolute left-0 top-0"
                  style={{
                    width: `${Math.min(taxSavingsPercentage, 100)}%`,
                  }}
                ></div>
                <div
                  className="progress-fill-new bg-blue-500 h-3 rounded-full absolute top-0"
                  style={{
                    left: `${Math.min(taxSavingsPercentage, 100)}%`,
                    width: `${Math.min(
                      futureTaxSavingsPercentage - taxSavingsPercentage,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Labels */}
            <div className="progress-labels flex items-center justify-between mb-6">
              <div className="left-label text-sm">
                <span className="text-green-600">Past taxes deductions</span>
                <span className="text-gray-600"> + </span>
                <span className="text-blue-500">this event deduction</span>
              </div>
              <p className="right-link text-sm text-blue-600 cursor-pointer hover:underline">
                Total Annual Savings
              </p>
            </div>

            {/* Events Usage Progress */}
            <div className="events-usage border-t pt-4">
              <div className="usage-row flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Events Used
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {totalDaysUsed}/{totalEvents}
                </span>
              </div>
              <Progress
                value={(totalDaysUsed / totalEvents) * 100}
                className="usage-progress w-full h-2 mb-2"
              />
              <div className="usage-meta flex justify-between text-sm text-gray-600">
                <span>Current: {number_of_event_days_used}</span>
                {newEventDays > 0 && (
                  <span className="blue text-blue-500">
                    +{newEventDays} new
                  </span>
                )}
                <span>Remaining: {totalEvents - totalDaysUsed}</span>
              </div>
              {totalDaysUsed > totalEvents && (
                <div className="limit-warning mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  ⚠️ This event would exceed the {totalEvents}-day annual limit
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

TaxDeductionsCard.displayName = "TaxDeductionsCard";
