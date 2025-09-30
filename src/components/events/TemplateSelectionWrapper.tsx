"use client";

import { Button } from "@/components/ui";
import { Calendar } from "lucide-react";
import { TemplateSelectionModal } from "@/components/events/TemplateSelectionModal";
import { useRouter } from "next/navigation";
import { EventTemplateDatabase } from "@/@types";

interface TemplateSelectionWrapperProps {
  templates: EventTemplateDatabase[];
  hasSelectedTemplate: boolean;
}

export function TemplateSelectionWrapper({
  templates,
  hasSelectedTemplate,
}: TemplateSelectionWrapperProps) {
  const router = useRouter();

  const handleTemplateSelect = (templateId: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("template", templateId);
    router.push(currentUrl.pathname + currentUrl.search);
  };

  console.log("hasSelectedTemplate", hasSelectedTemplate);

  if (hasSelectedTemplate || templates.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Start with a Template
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose a template to pre-fill your event details.
            </p>
          </div>
          <TemplateSelectionModal
            templates={templates}
            onTemplateSelect={handleTemplateSelect}
          >
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Select Template
            </Button>
          </TemplateSelectionModal>
        </div>
      </div>
    </div>
  );
}
