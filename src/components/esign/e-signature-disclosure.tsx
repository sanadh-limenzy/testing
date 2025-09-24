"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ESignatureDisclosureProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  title?: string;
}

export default function ESignatureDisclosure({
  isOpen,
  onClose,
  onAccept,
  title = "E SIGNATURE"
}: ESignatureDisclosureProps) {
  const [isAgreed, setIsAgreed] = useState(false);

  const handleSave = () => {
    if (isAgreed) {
      onAccept();
      onClose();
    }
  };

  const handleCancel = () => {
    setIsAgreed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-700 mb-4">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <DialogDescription className="text-base">
            Please read the{" "}
            <a 
              href="#" 
              className="text-blue-600 underline hover:text-blue-800"
            >
              Electronic Record and Signature Disclosure
            </a>
          </DialogDescription>

          <div className="flex items-start space-x-3 py-4">
            <input
              type="checkbox"
              id="agree-checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label 
              htmlFor="agree-checkbox" 
              className="text-sm leading-5 cursor-pointer"
            >
              I agree to use electronic records and signatures
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isAgreed}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
