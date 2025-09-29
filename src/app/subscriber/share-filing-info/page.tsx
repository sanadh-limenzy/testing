"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTaxPacket } from "@/hooks/useTaxPacket";

export default function ShareFilingInfoPage() {
  const [email, setEmail] = useState("");
  const [ccOwnEmail, setCcOwnEmail] = useState(false);

  const {
    isLoadingPreview,
    isLoadingSend,
    generatePreview,
    sendPacket,
    isAnyLoading,
  } = useTaxPacket({ selectedYear: new Date().getFullYear().toString() });

  const handlePreviewPacket = async () => {
    try {
      await generatePreview();
    } catch {
      // Error handling is done in the hook
    }
  };

  const handleSendPacket = async () => {
    try {
      await sendPacket(email, ccOwnEmail);
    } catch {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tax Filing 2025</h1>

      {/* Form Section */}
      <Card className="max-w-2xl mx-auto p-8 shadow-sm border-gray-100">
        <div className="space-y-6">
          {/* Main Instruction */}
          <div>
            <p className="text-lg font-bold text-gray-900">
              Sent packet to your Tax Pro to file for 2025
              <span className="text-red-500 ml-1">*</span>
            </p>
            <p className="text-sm text-gray-700 mt-2">
              You can send the packet to your email if you file your own taxes.
            </p>
          </div>

          {/* Email Input Field */}
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email ID (To)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 text-base bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* CC Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cc-email"
              checked={ccOwnEmail}
              onCheckedChange={(checked) => setCcOwnEmail(checked as boolean)}
            />
            <label
              htmlFor="cc-email"
              className="text-sm text-gray-900 cursor-pointer"
            >
              (cc) my own email
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={handlePreviewPacket}
              disabled={isAnyLoading}
              variant={"secondary"}
              className="flex-1 h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingPreview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Preview...
                </>
              ) : (
                "Preview Packet"
              )}
            </Button>
            <Button
              onClick={handleSendPacket}
              disabled={isAnyLoading || !email.trim()}
              className="flex-1 h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingSend ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Packet...
                </>
              ) : (
                "Send Packet"
              )}
            </Button>
          </div>

          {/* Congratulations Message */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-700">
              Congratulations! You&apos;re about to unlock{" "}
              <span className="font-bold text-gray-900">$5,108</span> of your
              hard-earned money!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
