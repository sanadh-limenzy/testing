"use client";
import { useUserData } from "@/hooks/useUserData";
import { EventTemplatesSection } from "./EventTemplatesSection";
import { ReimbursementPlanSection } from "./ReimbursementPlanSection";

export function SettingsPage() {
  const { userData} = useUserData();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* Event Templates Section */}
        <EventTemplatesSection />

        {/* Reimbursement Plan Section */}
        <ReimbursementPlanSection
          alreadyHaveReimbursementPlan={
            userData?.subscriberProfile?.is_already_have_reimbursement_plan ||
            false
          }
          reimbursementPlan={
            userData?.subscriberProfile?.reimbursement_plan
          }
        />
      </div>
    </div>
  );
}
