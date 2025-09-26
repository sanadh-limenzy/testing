"use client";

import { Button } from "@/components/ui/button";
import { useEventForm } from "@/contexts/EventFormContext";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Link from "next/link";
import { useState } from "react";
import { useEvent } from "@/hooks/useEvent";

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
  console.log(isValid, "isValid");
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
        <Button
          type="button"
          variant="outline"
          disabled={form.formState.isSubmitting}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Save As Template
        </Button>
        {!isEditMode && isCreateMode && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={!isValid || form.formState.isSubmitting}
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
          onClick={onSubmit}
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
