"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useDeletePromoCode } from "@/hooks/usePromoCodes";
import { toast } from "sonner";

interface DeletePromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoCode: {
    id: string;
    name: string;
    code: string;
    used_by_count?: number;
  };
}

export function DeletePromoCodeModal({
  isOpen,
  onClose,
  promoCode,
}: DeletePromoCodeModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deletePromoCodeMutation = useDeletePromoCode(promoCode.id);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePromoCodeMutation.mutateAsync();
      toast.success("Promo code deleted successfully!");
      onClose();
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete promo code"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const hasUsage = (promoCode.used_by_count || 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Delete Promo Code
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {promoCode.name}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Code:</span>
                <span className="ml-2 text-sm font-mono text-gray-900">
                  {promoCode.code}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Usage:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {promoCode.used_by_count || 0} times
                </span>
              </div>
            </div>
          </div>

          {hasUsage && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">
                    This promo code has been used
                  </p>
                  <p className="text-yellow-700 mt-1">
                    Deleting it may affect users who have already used this
                    code. Consider deactivating it instead.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
