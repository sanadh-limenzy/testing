"use client";

import React from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export type UserType = "Subscriber" | "Accountant";

interface UserTypeStepProps {
  onNext: (userType: UserType) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
}

const userTypes = [
  {
    type: "Subscriber" as UserType,
    title: "Subscriber",
    description:
      "I want to manage my own rental properties and generate documents",
    features: [
      "Manage rental properties",
      "Generate rental documents",
      "Track property expenses",
      "Access to basic features",
    ],
    process: {
      title: "How it Works for Business Owners",
      steps: [
        "Host up to 14 business meetings or events at your home",
        "Business pays you rent for the event",
        "Business deducts rent. You get income tax-free",
      ],
    },
    icon: "🏠",
  },
  {
    type: "Accountant" as UserType,
    title: "Tax Professional",
    description:
      "I'm a tax professional managing multiple clients' rental properties",
    features: [
      "Manage multiple client accounts",
      "Bulk document generation",
      "Advanced reporting tools",
      "Client management dashboard",
    ],
    process: {
      title: "How the Process Works",
      steps: [
        "You sign up for FREE",
        "Your client books qualifying events on the website software",
        "You receive an Augusta Tax Packet and follow simple instructions when filing their taxes",
        "Your client saves money & you get paid to be a hero to them",
      ],
    },
    icon: "📊",
  },
];

export const UserTypeStep: React.FC<UserTypeStepProps> = ({
  onNext,
  onBack,
  loading = false,
  error,
}) => {
  const [selectedType, setSelectedType] = React.useState<UserType | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType) {
      onNext(selectedType);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Choose Your Account Type
        </h2>
        <p className="mt-2 text-gray-600">
          Select the type of account that best describes how you&apos;ll use
          TheAugustaRule
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {userTypes.map((userType) => (
            <Card
              key={userType.type}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedType === userType.type
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-gray-300"
              }`}
              onClick={() => setSelectedType(userType.type)}
            >
              <CardHeader className="text-center">
                <div className="text-4xl mb-2">{userType.icon}</div>
                <CardTitle className="text-xl">{userType.title}</CardTitle>
                <CardDescription>{userType.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  {userType.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Process Information */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                    {userType.process.title}
                  </h4>
                  <ol className="space-y-1 text-xs text-gray-600">
                    {userType.process.steps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary font-bold mr-2 text-xs">
                          {index + 1}.
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <div className="flex space-x-4">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={loading}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || !selectedType}
            className="flex-1"
          >
            {loading ? "Creating Account..." : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
};
