"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Users, Clock } from "lucide-react";
import { EventTemplateDatabase } from "@/@types";

interface TemplateSelectionModalProps {
  templates: EventTemplateDatabase[];
  onTemplateSelect: (templateId: string) => void;
  children: React.ReactNode;
}

export function TemplateSelectionModal({
  templates,
  onTemplateSelect,
  children,
}: TemplateSelectionModalProps) {
  const [open, setOpen] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start with a Template</DialogTitle>
          <DialogDescription>
            Choose a template to pre-fill your event details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No templates available. Create a new event from scratch.
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{template.people_count} attendees</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {template.start_time} - {template.end_time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTemplateSelect(template.id);
                    }}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Use
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
