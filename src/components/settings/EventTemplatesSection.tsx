"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { useDeleteEventTemplate } from "@/hooks/useEventTemplates";
import { EventTemplateDatabase } from "@/@types";
import Link from "next/link";

interface EventTemplatesSectionProps {
  eventTemplates: EventTemplateDatabase[];
}

export function EventTemplatesSection({
  eventTemplates,
}: EventTemplatesSectionProps) {
  const deleteTemplateMutation = useDeleteEventTemplate();

  return (
    <Card className="p-6 bg-white shadow-sm border border-gray-200">
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 underline underline-offset-8 decoration-red-500 pb-1">
              Your Event Templates
            </h2>
            <p className="text-gray-600 text-sm max-w-2xl">
              Adding an event template will allow you to autofill fields when
              creating an event. This is not address specific.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              asChild
              className="h-10 w-10 p-0 bg-blue-100 hover:bg-blue-200 text-blue-700 border-0"
            >
              <Link href="/subscriber/templates/create">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-10 px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 border-0"
            >
              <Link href="/subscriber/templates">See All</Link>
            </Button>
          </div>
        </div>

        {/* Content */}
        {eventTemplates && eventTemplates.length > 0 ? (
          <div className="space-y-3">
            {eventTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {template.title ||
                        template.draft_name ||
                        "Untitled Template"}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {template.people_count && (
                        <span>{template.people_count} people</span>
                      )}
                      {template.amount && <span>${template.amount}</span>}
                      <span>
                        {template.start_time && template.end_time
                          ? `${template.start_time} - ${template.end_time}`
                          : "No time set"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/subscriber/events/create?template=${template.id}`}
                    >
                      <Button
                        asChild
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <span>
                          <Calendar className="h-4 w-4 mr-2" />
                          Use This Template
                        </span>
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={async () =>
                        await deleteTemplateMutation.mutateAsync(template.id)
                      }
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-600">No Event Templates found.</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first template to get started.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
