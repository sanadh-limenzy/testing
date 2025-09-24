"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  note?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: "default" | "warning" | "destructive";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  note,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
          iconBg: "bg-yellow-100",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      case "destructive":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          iconBg: "bg-red-100",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
        };
      default:
        return {
          icon: null,
          iconBg: "",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {styles.icon && (
              <div className={`p-2 rounded-full ${styles.iconBg}`}>
                {styles.icon}
              </div>
            )}
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        {note && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">
                  Please Note
                </h4>
                <p className="text-sm text-yellow-700">{note}</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 sm:flex-none"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`flex-1 sm:flex-none ${styles.confirmButton}`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
