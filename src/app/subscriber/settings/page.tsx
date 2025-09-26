import { SettingsPage } from "@/components/settings/SettingsPage";
import { RentalAddress } from "@/@types/subscriber";
import { ProposalDatabase, EventTemplateDatabase, UserNotificationSettings, PlanDatabase } from "@/@types";
import { cookies } from "next/headers";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

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

async function getSettingsData(cookieStore: ReadonlyRequestCookies): Promise<SettingsData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscriber/settings`, {
      cache: 'no-store', // Ensure fresh data on each request
      headers: {
        Cookie: cookieStore.toString(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch settings data');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching settings data:', error);
    // Return default values on error
    return {
      rentalAddresses: [],
      reimbursementPlan: null,
      alreadyHaveReimbursementPlan: false,
      eventTemplates: [],
      notificationSettings: null,
      plans: [],
      currentPlan: null,
      isAutoRenewSubscription: false,
    };
  }
}

export default async function Settings() {
  const cookieStore = await cookies();
  const settingsData = await getSettingsData(cookieStore);

  return <SettingsPage settingsData={settingsData} />;
}