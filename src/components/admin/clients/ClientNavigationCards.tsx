"use client";

import { FolderOpen, Clock, Users, Send } from "lucide-react";

interface NavigationCard {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ClientNavigationCardsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationCards: NavigationCard[] = [
  {
    id: "tax-packet",
    title: "Tax Packet",
    icon: FolderOpen,
  },
  {
    id: "history",
    title: "History",
    icon: Clock,
  },
  {
    id: "business-info",
    title: "Business Information",
    icon: Users,
  },
  {
    id: "rental-info",
    title: "Rental Information",
    icon: Users,
  },
  {
    id: "referrals",
    title: "Referrals",
    icon: Send,
  },
];

export function ClientNavigationCards({
  activeTab,
  onTabChange,
}: ClientNavigationCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {navigationCards.map((card) => {
        const IconComponent = card.icon;
        const isActive = activeTab === card.id;
        return (
          <button
            key={card.id}
            onClick={() => onTabChange(card.id)}
            className={`p-4 md:p-6 rounded-lg border-2 transition-all duration-200 ${
              isActive
                ? "bg-gray-100 border-primary shadow-md"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-2 md:mb-3 ${
                  isActive ? "text-primary" : "text-gray-500"
                }`}
              >
                <IconComponent className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <span
                className={`text-xs md:text-sm font-medium ${
                  isActive ? "text-primary" : "text-gray-700"
                }`}
              >
                {card.title}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

