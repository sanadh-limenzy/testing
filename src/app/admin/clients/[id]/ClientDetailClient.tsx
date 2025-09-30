"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Mail, 
  Copy, 
  Edit, 
  FolderOpen, 
  Clock, 
  Users, 
  Send,
  ArrowLeft,
  Check
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  addedOn: string;
  currentPlan: string;
  planStatus: "active" | "inactive";
  referredBy: string;
  status: "active" | "inactive";
  businessName?: string;
  userType: "Admin" | "Subscriber" | "Accountant" | "Vendor";
  isActive: boolean;
  isSubscriptionActive: boolean;
  planStartDate?: string;
  planEndDate?: string;
  taxPro?: string;
}

interface ClientDetailClientProps {
  client: Client;
}

export function ClientDetailClient({ client }: ClientDetailClientProps) {
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

  const navigationCards = [
    {
      id: 'tax-packet',
      title: 'Tax Packet',
      icon: FolderOpen,
      isActive: true,
      href: `/admin/clients/${client.id}/tax-packet`
    },
    {
      id: 'history',
      title: 'History',
      icon: Clock,
      isActive: false,
      href: `/admin/clients/${client.id}/history`
    },
    {
      id: 'business-info',
      title: 'Business Information',
      icon: Users,
      isActive: false,
      href: `/admin/clients/${client.id}/business-info`
    },
    {
      id: 'rental-info',
      title: 'Rental Information',
      icon: Users,
      isActive: false,
      href: `/admin/clients/${client.id}/rental-info`
    },
    {
      id: 'referrals',
      title: 'Referrals',
      icon: Send,
      isActive: false,
      href: `/admin/clients/${client.id}/referrals`
    }
  ];

  return (
    <div className="min-h-screen bg-white p-8 font-medium">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/admin/clients"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
        </div>

        {/* Client Profile Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            {/* Left Side - Client Info */}
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(client.firstName, client.lastName)}
              </div>
              
              {/* Client Details */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 font-eb-garamond">
                    {client.firstName} {client.lastName}
                  </h1>
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                    {client.currentPlan.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-1 text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Tax Pro:</span>
                    <span>{client.taxPro || '--'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{client.phoneCode} {client.phone}</span>
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
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
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
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="bg-primary text-white border-primary hover:bg-primary/90 h-10 px-6"
              >
                Spoof
              </Button>
              <Button 
                className="bg-primary text-white hover:bg-primary/90 h-12 px-6"
              >
                View Documents
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="w-10 h-10 p-0 border-primary text-primary hover:bg-primary/10"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {navigationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                  card.isActive
                    ? 'bg-gray-100 border-primary shadow-md'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`mb-3 ${
                    card.isActive ? 'text-primary' : 'text-gray-500'
                  }`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <span className={`text-sm font-medium ${
                    card.isActive ? 'text-primary' : 'text-gray-700'
                  }`}>
                    {card.title}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
