"use client";

import { Button } from "@/components/ui/button";
import { useEventForm } from "@/contexts/EventFormContext";
import { Plus, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { useEvent } from "@/hooks/useEvent";
import { useCompleteEvent } from "@/hooks/useCompleteEvent";
import { toast } from "sonner";

interface EventFormActionsProps {
  isValid: boolean;
  onSubmit: () => void;
  eventId?: string;
}

export function EventFormActions({
  isValid,
  onSubmit,
  eventId,
}: EventFormActionsProps) {
  const { isEditMode, form, isCreateMode } = useEventForm();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const completeEventMutation = useCompleteEvent();

  // Get event data to check completion conditions
  const { data: eventData } = useEvent(eventId || "");

  // Check if event can be completed
  const canCompleteEvent = () => {
    if (!eventId || !eventData?.data) return false;

    const event = eventData.data;

    // Event must not already be completed
    if (event.is_completed_event) return false;

    // Event end date must have passed
    const endDate = new Date(event.end_date);
    const now = new Date();
    if (endDate > now) return false;

    // Rental agreement must be signed
    const rentalAgreement = event.rental_agreement;
    if (
      !rentalAgreement ||
      (!rentalAgreement.is_signature_done &&
        !rentalAgreement.is_business_signature_done)
    ) {
      return false;
    }

    return true;
  };

  const handleCompleteEvent = async () => {
    if (!eventId || !canCompleteEvent()) return;

    setIsCompleting(true);
    try {
      await completeEventMutation.mutateAsync(eventId);
    } catch {
      toast.error("Failed to complete event");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSaveAsTemplate = () => {
    if (!form.getValues("templateName")?.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    form.setValue("currentAction", "template");
    onSubmit();
    setIsSaveTemplateOpen(false);
    form.setValue("templateName", "");
  };

  return (
    <div className={`gap-4 pt-6 border-t`}>
      {eventId ? (
        <div className="flex gap-2 justify-between items-center">
          <PreviewInvoice eventId={eventId} />
          <Button variant="outline" asChild className="flex-1">
            <Link href={`/subscriber/rental-agreement/${eventId}`}>
              View Rental Agreement
            </Link>
          </Button>
        </div>
      ) : null}
      <div className="flex gap-2 justify-between items-center w-full mt-2">
        <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={!isValid || form.formState.isSubmitting}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Save As Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
              <DialogDescription>
                Save your event configuration as a template for future use. You
                can reuse this template when creating new events.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Board Meeting Template"
                  value={form.getValues("templateName")}
                  onChange={(e) =>
                    form.setValue("templateName", e.target.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveAsTemplate();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSaveTemplateOpen(false);
                  form.setValue("templateName", "");
                }}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={
                  form.formState.isSubmitting ||
                  !form.getValues("templateName")?.trim()
                }
              >
                {form.formState.isSubmitting ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {!isEditMode && isCreateMode && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={form.formState.isSubmitting}
            onClick={() => {
              form.setValue("currentAction", "draft");
              onSubmit();
            }}
          >
            Save As Draft
          </Button>
        )}
        <Button
          type="submit"
          className={`flex-1 ${
            isValid ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400"
          } text-white`}
          disabled={!isValid || form.formState.isSubmitting}
          onClick={() => {
            form.setValue("currentAction", isEditMode ? "update" : "book");
            onSubmit();
          }}
        >
          {isEditMode
            ? form.formState.isSubmitting
              ? "Updating Event..."
              : "Update Event"
            : form.formState.isSubmitting
            ? "Booking Event..."
            : "Book Event"}
        </Button>
      </div>

      {/* Complete Event Button - Only show in edit mode when conditions are met */}
      {isEditMode && eventId && canCompleteEvent() && (
        <div className="mt-4">
          <Button
            onClick={handleCompleteEvent}
            disabled={isCompleting || completeEventMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isCompleting || completeEventMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Completing Event...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Complete Event
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

const PreviewInvoice = ({
  invoice_url,
  eventId,
}: {
  eventId: string;
  invoice_url?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: event, isLoading: isLoadingEvent } = useEvent(eventId);

  // const { mutateAsync: createEventInvoice, isLoading: isLoadingCreateEventInvoice } = useCreateEventInvoice();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={isLoadingEvent}>
        <Button variant="outline" className="flex-1">
          Preview Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className=" md:max-w-[80vw] h-[80vh] w-full">
        <DialogHeader className="hidden">
          <DialogTitle>Preview Invoice</DialogTitle>
        </DialogHeader>
        {invoice_url || event?.data?.event_invoices?.url ? (
          <iframe
            src={invoice_url || event?.data?.event_invoices?.url}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              backgroundColor: "#fff",
            }}
            title="Invoice PDF"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
