"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InfoIcon, Check, Circle } from "lucide-react";
import { useEventForm } from "@/contexts/EventFormContext";

interface DefensibilityItem {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
}

interface DefensibilityScoreCardProps {
  defendabilityItems: DefensibilityItem[];
  completedCount: number;
}

export const DefensibilityScoreCard = React.memo(({
  defendabilityItems,
  completedCount,
}: DefensibilityScoreCardProps) => {
  const { form, isReadOnly } = useEventForm();
  const { setValue } = form;

  return (
    <Card>
      <CardContent className="p-6">
        <TooltipProvider>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {completedCount}/5
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                Defensibility Score
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-sm max-w-[300px] font-medium">
                  <p className="w-full text-center">
                    Some event details will not be added to the score until you
                    upload documents recorded during the event. All events can
                    be edited or canceled after they occurred.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            We recommend your score is nothing less than 100%
          </p>

          <div className="space-y-4">
            {defendabilityItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="mt-1">
                  {item.completed ? (
                    <div
                      onClick={
                        item.title === "Money Paid to Personal"
                          ? () => setValue("money_paid_to_personal", false, { shouldValidate: true, shouldDirty: true , shouldTouch: true})
                          : undefined
                      }
                      className={`w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ${
                        !isReadOnly && item.title === "Money Paid to Personal"
                          ? " cursor-pointer"
                          : ""
                      }`}
                    >
                      <Check className={`h-4 w-4 text-white`} />
                    </div>
                  ) : (
                    <Circle
                      onClick={
                        !isReadOnly && item.title === "Money Paid to Personal"
                          ? () => setValue("money_paid_to_personal", true, { shouldValidate: true, shouldDirty: true , shouldTouch: true})
                          : undefined
                      }
                      className={`w-6 h-6 text-gray-300 ${
                        !isReadOnly && item.title === "Money Paid to Personal"
                          ? "cursor-pointer"
                          : ""
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.subtitle}</p>
                  {item.id === "payment" && (
                    <p className="text-sm text-green-600 mt-1">
                      Check this box when your business entity has transferred
                      the rent payment into your personal bank account.
                    </p>
                  )}
                  {item.id === "description" && !item.completed && (
                    <p className="text-sm text-red-500 mt-1">
                      Please fill in both the description field.
                    </p>
                  )}
                  {item.id === "attendance" && !item.completed && (
                    <p className="text-sm text-red-500 mt-1">
                      Please enter at least 3 attendees.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
});

DefensibilityScoreCard.displayName = "DefensibilityScoreCard";
