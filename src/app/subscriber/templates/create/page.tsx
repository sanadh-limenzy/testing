"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateEventTemplate } from "@/hooks/useEventTemplates";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

const templateFormSchema = z.object({
  title: z
    .string()
    .min(3, "Template name must be at least 3 characters")
    .max(100, "Template name must be no more than 100 characters"),
  description: z
    .string()
    .max(1000, "Description must be no more than 1000 characters"),
  people_count: z
    .string()
    .regex(/^\d+$/, "Must be a valid number")
    .transform((val) => parseInt(val))
    .pipe(
      z
        .number()
        .min(3, "Minimum 3 attendees required")
        .max(99, "Maximum 99 attendees allowed")
    )
    .transform((val) => val.toString()),
  start_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  end_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  excluded_areas: z.string().optional(),
  is_manual_valuation: z.boolean(),
  add_to_my_calendar: z.boolean(),
  people_names: z.array(z.string()).optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

const excludedAreas = [
  "Bedroom",
  "Bathroom",
  "Kitchen",
  "Garage",
  "Basement",
  "Attic",
  "Home Office",
];

export default function CreateTemplatePage() {
  const router = useRouter();
  const createTemplateMutation = useCreateEventTemplate();
  const [peopleNames, setPeopleNames] = useState<string[]>([]);
  const [newPersonName, setNewPersonName] = useState("");

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: "",
      description: "",
      people_count: "",
      start_time: "08:00",
      end_time: "13:00",
      excluded_areas: "",
      is_manual_valuation: false,
      add_to_my_calendar: false,
      people_names: [],
    },
    mode: "onBlur",
  });

  const addPersonName = () => {
    if (newPersonName.trim() && !peopleNames.includes(newPersonName.trim())) {
      const updatedNames = [...peopleNames, newPersonName.trim()];
      setPeopleNames(updatedNames);
      form.setValue("people_names", updatedNames);
      setNewPersonName("");
    }
  };

  const removePersonName = (index: number) => {
    const updatedNames = peopleNames.filter((_, i) => i !== index);
    setPeopleNames(updatedNames);
    form.setValue("people_names", updatedNames);
  };

  const handleSubmit = async (data: TemplateFormData) => {
    try {
      const templateData = {
        ...data,
        people_count: parseInt(data.people_count),
        is_used_as_template: true,
        mongo_id: `template_${Date.now()}`, // Generate a unique mongo_id
        created_by: "", // Will be set by the API
        people_names: data.people_names || [],
      };

      await createTemplateMutation.mutateAsync(templateData);
      router.push("/subscriber/templates");
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/subscriber/templates">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Create Event Template
            </h1>
            <p className="text-gray-600 mt-1">
              Create a reusable template to speed up your event creation
              process.
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Template Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Template Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-medium text-gray-700">
                      Template Name
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="text-sm max-w-[300px] font-medium">
                          <p className="w-full text-center">
                            Choose a descriptive name for your template that
                            will help you identify it later.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-xs text-gray-500">
                    {form.watch("title")?.length || 0}/100
                  </span>
                </div>
                <Input
                  {...form.register("title")}
                  placeholder="e.g., Weekly Team Meeting Template"
                  maxLength={100}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <span className="text-xs text-gray-500">
                    {form.watch("description")?.length || 0}/1000
                  </span>
                </div>
                <Textarea
                  {...form.register("description")}
                  placeholder="Describe what this template is for and any specific details..."
                  rows={4}
                  maxLength={1000}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              {/* People Count */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Number of Attendees
                </Label>
                <Input
                  {...form.register("people_count")}
                  type="number"
                  min="3"
                  max="99"
                  placeholder="3"
                />
                {form.formState.errors.people_count && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.people_count.message}
                  </p>
                )}
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Start Time
                  </Label>
                  <Input {...form.register("start_time")} type="time" />
                  {form.formState.errors.start_time && (
                    <p className="text-xs text-red-500 mt-1">
                      {form.formState.errors.start_time.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    End Time
                  </Label>
                  <Input {...form.register("end_time")} type="time" />
                  {form.formState.errors.end_time && (
                    <p className="text-xs text-red-500 mt-1">
                      {form.formState.errors.end_time.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Excluded Areas */}
              <div className="space-y-2">
                <div className="mb-2">
                  <Label className="flex items-center gap-2">
                    Areas Not Included in Rental{" "}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="info-icon h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="text-sm max-w-[300px] font-medium">
                          <p className="text-center">
                            List areas of your home that are not included in the rental
                            event. Prime examples could be bedrooms, a home office,
                            private storage areas, etc.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {excludedAreas.map((area) => (
                    <Badge
                      key={area}
                      variant={
                        form.watch("excluded_areas") &&
                        form.watch("excluded_areas")!.includes(area)
                          ? "default"
                          : "outline"
                      }
                      className="rounded-md px-2 py-1 cursor-pointer"
                      onClick={() => {
                        const currentAreas = form.watch("excluded_areas")?.trim() || "";
                        const newAreas =
                          currentAreas && currentAreas.includes(area)
                            ? currentAreas
                                .replace(area, "")
                                .replace(/,\s*,/g, ",")
                                .replace(/^,|,$/g, "")
                            : currentAreas
                            ? `${currentAreas}, ${area}`
                            : area;
                        form.setValue("excluded_areas", newAreas, { 
                          shouldValidate: true, 
                          shouldDirty: true, 
                          shouldTouch: true 
                        });
                      }}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-col">
                  <Input
                    placeholder="Add custom area"
                    value={form.watch("excluded_areas") || ""}
                    onChange={(e) => {
                      form.setValue("excluded_areas", e.target.value, { 
                        shouldValidate: true, 
                        shouldDirty: true, 
                        shouldTouch: true 
                      });
                    }}
                    maxLength={1000}
                  />
                  {form.formState.errors.excluded_areas && (
                    <div className="text-xs text-red-500 mt-1">
                      {form.formState.errors.excluded_areas.message}
                    </div>
                  )}
                </div>
              </div>

              {/* People Names */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Attendee Names (Optional)
                </Label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder="Enter attendee name"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addPersonName();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addPersonName}
                      disabled={!newPersonName.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {peopleNames.length > 0 && (
                    <div className="space-y-2">
                      {peopleNames.map((name, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm">{name}</span>
                          <Button
                            type="button"
                            onClick={() => removePersonName(index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Template Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Template Settings
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      {...form.register("is_manual_valuation")}
                      id="manual_valuation"
                    />
                    <Label
                      htmlFor="manual_valuation"
                      className="text-sm text-gray-700"
                    >
                      Use manual valuation for this template
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      {...form.register("add_to_my_calendar")}
                      id="add_to_calendar"
                    />
                    <Label
                      htmlFor="add_to_calendar"
                      className="text-sm text-gray-700"
                    >
                      Add events created from this template to my calendar
                    </Label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link href="/subscriber/templates">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createTemplateMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {createTemplateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Template"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
