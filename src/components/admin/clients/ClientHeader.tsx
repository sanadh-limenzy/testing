"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Copy, Edit, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  currentPlan: string;
  taxPro?: string;
}

interface ClientHeaderProps {
  client: Client;
}

export function ClientHeader({ client }: ClientHeaderProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleCopyPhone = async () => {
    const phoneNumber = `${client.phoneCode} ${client.phone}`;
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
      toast.success("Phone number copied!");
    } catch (error) {
      console.error("Failed to copy phone number:", error);
      toast.error("Failed to copy phone number");
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(client.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
      toast.success("Email copied!");
    } catch (error) {
      console.error("Failed to copy email:", error);
      toast.error("Failed to copy email");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left Side - Client Info */}
        <div className="flex items-start gap-4 md:gap-6">
          {/* Avatar */}
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold shrink-0">
            {getInitials(client.firstName, client.lastName)}
          </div>

          {/* Client Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                {client.firstName} {client.lastName}
              </h1>
              <span className="bg-primary text-white px-3 py-1 rounded-full text-xs md:text-sm font-medium shrink-0">
                {client.currentPlan.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1 text-sm md:text-base text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-medium">Tax Pro:</span>
                <span className="truncate">{client.taxPro || "--"}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Phone className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {client.phoneCode} {client.phone}
                </span>
                <button
                  onClick={handleCopyPhone}
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {copiedPhone ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-500" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate break-all">{client.email}</span>
                <button
                  onClick={handleCopyEmail}
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {copiedEmail ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex md:flex-col gap-2 md:gap-3">
          <Button variant="outline" className="flex-1 md:flex-none h-10 px-4 md:px-6">
            Spoof
          </Button>
          <Button asChild className="flex-1 md:flex-none bg-primary h-10 md:h-12 px-4 md:px-6">
            <Link href={`/admin/documents?userId=${client.id}`}>
              View Documents
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-10 h-10 p-0 border-primary text-primary hover:bg-primary/10 shrink-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

