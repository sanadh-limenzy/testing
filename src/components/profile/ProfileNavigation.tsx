"use client";

import React, { useState } from "react";
import { Key, Briefcase, Mail, MailCheck } from "lucide-react";
import { RentalInformation } from "./RentalInformation";
import { BusinessInformation } from "./BusinessInformation";
import { TaxProEmail } from "./TaxProEmail";
import { AccountsPayableEmail } from "./AccountsPayableEmail";

type NavigationItem = "rental" | "business" | "tax-pro" | "accounts-payable";

interface NavigationItemConfig {
  id: NavigationItem;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: () => React.JSX.Element;
}

const navigationItems: NavigationItemConfig[] = [
  {
    id: "rental",
    label: "Rental Information",
    icon: Key,
    component: RentalInformation,
  },
  {
    id: "business",
    label: "Business Information",
    icon: Briefcase,
    component: BusinessInformation,
  },
  {
    id: "tax-pro",
    label: "Tax Pro Email",
    icon: Mail,
    component: TaxProEmail,
  },
  {
    id: "accounts-payable",
    label: "Accounts Payable Email",
    icon: MailCheck,
    component: AccountsPayableEmail,
  },
];

export function ProfileNavigation() {
  const [activeItem, setActiveItem] = useState<NavigationItem>("rental");

  const handleItemClick = (itemId: NavigationItem) => {
    setActiveItem(itemId);
  };

  const ActiveComponent = navigationItems.find(
    (item) => item.id === activeItem
  )?.component;

  return (
    <div className="space-y-6">
      {/* Navigation Items */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <div
              key={item.id}
              className={`flex flex-col items-center space-y-2 p-4 rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? "bg-primary/10 border-2 border-primary"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleItemClick(item.id)}
            >
              <div
                className={`p-3 rounded-lg ${
                  isActive ? "bg-primary text-white" : "bg-gray-100"
                }`}
              >
                <Icon
                  className={`h-6 w-6 ${
                    isActive ? "text-white" : "text-gray-600"
                  }`}
                />
              </div>
              <span
                className={`text-sm font-medium text-center ${
                  isActive ? "text-primary font-semibold" : "text-gray-700"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
