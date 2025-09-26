"use client";
import { EventTemplatesSection } from "./EventTemplatesSection";
import { ReimbursementPlanSection } from "./ReimbursementPlanSection";
import { HomeOfficeDeductionSection } from "./HomeOfficeDeductionSection";
import { NotificationSettingsSection } from "./NotificationSettingsSection";
import { RentalAddress } from "@/@types/subscriber";
import {
  ProposalDatabase,
  EventTemplateDatabase,
  UserNotificationSettings,
  PlanDatabase,
} from "@/@types";
import { PlansSection } from "./PlansSection";

interface SettingsData {
  rentalAddresses: RentalAddress[];
  reimbursementPlan: ProposalDatabase | null;
  alreadyHaveReimbursementPlan: boolean;
  eventTemplates: EventTemplateDatabase[];
  notificationSettings: UserNotificationSettings | null;
  plans: PlanDatabase[];
  currentPlan: string | null;
  isAutoRenewSubscription: boolean;
}

interface SettingsPageProps {
  settingsData: SettingsData;
}

export function SettingsPage({ settingsData }: SettingsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* Event Templates Section */}
        <EventTemplatesSection eventTemplates={settingsData.eventTemplates} />

        {/* Reimbursement Plan Section */}
        <ReimbursementPlanSection
          alreadyHaveReimbursementPlan={
            settingsData.alreadyHaveReimbursementPlan
          }
          reimbursementPlan={settingsData.reimbursementPlan}
        />

        {/* Home Office Deduction Section */}
        <HomeOfficeDeductionSection
          rentalAddresses={settingsData.rentalAddresses}
        />

        {/* Notification Settings Section */}
        <NotificationSettingsSection
          initialData={settingsData.notificationSettings}
        />

        <PlansSection
          initialData={settingsData.plans}
          currentPlan={settingsData.currentPlan || undefined}
          isAutoRenewSubscription={settingsData.isAutoRenewSubscription}
        />
      </div>
    </div>
  );
}
