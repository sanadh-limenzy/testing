import { ProposalDatabase } from "@/@types";
import RentalAgreementPage from "@/components/rental-agreement/RentalAgreementPage";
import { env } from "@/env";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;
  const cookieStore = await cookies();

  const response = await fetch(
    env.NEXT_PUBLIC_APP_URL + "/api/subscriber/pdf/rental-agreement-form",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
      body: JSON.stringify({
        event_id,
      }),
    }
  );

  const rentalAgreementData: { proposal: ProposalDatabase } = await response.json();


  if (!response.ok) {
    console.log(`Failed to fetch rental agreement: ${rentalAgreementData}`);
    throw new Error(`Failed to fetch rental agreement: ${response.statusText}`);
  }

  return <RentalAgreementPage rentalAgreementData={rentalAgreementData.proposal} />;
}
