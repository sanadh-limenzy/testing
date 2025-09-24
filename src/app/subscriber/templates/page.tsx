"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Loader2, Eye, Trash2, Calendar, Users, DollarSign } from "lucide-react";
import Link from "next/link";
import { useEventTemplates, useDeleteEventTemplate } from "@/hooks/useEventTemplates";
import { useState } from "react";

export default function TemplatesPage() {
  const { data, isLoading, error } = useEventTemplates({ isTemplate: true });
  const deleteTemplateMutation = useDeleteEventTemplate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (templateId: string) => {
    setDeletingId(templateId);
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      console.error("Failed to delete template:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Event Templates
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage reusable event templates to speed up your event creation process.
            </p>
          </div>
          <Link href="/subscriber/templates/create">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600">Loading templates...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <div className="text-red-500 text-lg mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Templates
            </h3>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Try Again
            </Button>
          </Card>
        ) : data && data.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((template) => (
              <Card key={template.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* Template Header */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {template.title || template.draft_name || "Untitled Template"}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {template.description}
                      </p>
                    )}
                  </div>

                  {/* Template Details */}
                  <div className="space-y-2">
                    {template.people_count && template.people_count > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{template.people_count} people</span>
                      </div>
                    )}
                    
                    {template.amount && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                        <span>${template.amount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {template.start_time && template.end_time && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{template.start_time} - {template.end_time}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <Link 
                      href={`/subscriber/templates/view/${template.id}`}
                      className="flex-1"
                    >
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(template.id)}
                      disabled={deletingId === template.id || deleteTemplateMutation.isPending}
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Templates Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first event template to streamline your event creation process. 
              Templates help you quickly set up events with pre-filled information.
            </p>
            <Link href="/subscriber/templates/create">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
