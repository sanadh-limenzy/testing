"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChangeDefaultAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  address: {
    nickname: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  isLoading?: boolean;
}

export function ChangeDefaultAddressModal({
  isOpen,
  onClose,
  onConfirm,
  address,
  isLoading = false,
}: ChangeDefaultAddressModalProps) {
  if (!address) return null;

  const fullAddress = `${address.street}, ${address.city}, ${address.state}, ${address.zip}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 uppercase">
            Change Default Address
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DialogDescription className="text-gray-600">
            Your new default address will be set to:
          </DialogDescription>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-bold text-gray-900 text-lg leading-tight">
              {address.nickname}
            </p>
            <p className="text-gray-700 mt-1">{fullAddress}</p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 uppercase font-semibold py-3 rounded-lg"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 uppercase font-semibold py-3 rounded-lg"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
