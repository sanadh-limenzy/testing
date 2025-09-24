"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Users,
  DollarSign,
  Clock,
  MapPin,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEventTemplates,
  useDeleteEventTemplate,
} from "@/hooks/useEventTemplates";
import { useState } from "react";

export default function TemplateViewPage() {
  const params = useParams();
  const templateId = params.id as string;

  const {
    data: templatesData,
    isLoading,
    error,
  } = useEventTemplates({ isTemplate: true });
  const deleteTemplateMutation = useDeleteEventTemplate();
  const [isDeleting, setIsDeleting] = useState(false);

  const template = templatesData?.data.find((t) => t.id === templateId);

  const handleDelete = async () => {
    if (!template) return;

    setIsDeleting(true);
    try {
      await deleteTemplateMutation.mutateAsync(template.id);
      // Redirect back to templates list after successful deletion
      window.location.href = "/subscriber/templates";
    } catch (error) {
      console.error("Failed to delete template:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600">Loading template...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="text-red-500 text-lg mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Template
            </h3>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <div className="space-x-2">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Try Again
              </Button>
              <Link href="/subscriber/templates">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Templates
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Template Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The template you&apos;re looking for doesn&apos;t exist or has
              been deleted.
            </p>
            <Link href="/subscriber/templates">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Link href="/subscriber/templates">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {template.title || template.draft_name || "Untitled Template"}
              </h1>
              <p className="text-gray-600 mt-1">
                Created on {new Date(template.created_at!).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Link href={`/subscriber/events/create?template=${templateId}`}>
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
        </div>

        {/* Template Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="space-y-4">
                {template.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {template.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {template.people_count && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users className="h-4 w-4 inline mr-2" />
                        People Count
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {template.people_count} people
                      </p>
                    </div>
                  )}

                  {template.amount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="h-4 w-4 inline mr-2" />
                        Amount
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                        ${template.amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {template.start_time && template.end_time && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="h-4 w-4 inline mr-2" />
                      Time Range
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {template.start_time} - {template.end_time}
                    </p>
                  </div>
                )}

                {template.excluded_areas && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Excluded Areas
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {template.excluded_areas}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* People Names */}
            {template.people_names && template.people_names.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Attendees
                </h2>
                <div className="space-y-2">
                  {template.people_names.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center text-gray-900 bg-gray-50 p-3 rounded-lg"
                    >
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      {name}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template Settings */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Template Settings
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Used as Template
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.is_used_as_template
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {template.is_used_as_template ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Manual Valuation
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.is_manual_valuation
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {template.is_manual_valuation ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Add to Calendar</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.add_to_my_calendar
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {template.add_to_my_calendar ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
              <div className="">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDelete}
                  disabled={isDeleting || deleteTemplateMutation.isPending}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Template
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Template Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Template Info
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(template.created_at!).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{" "}
                  {new Date(template.updated_at!).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">ID:</span> {template.id}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
