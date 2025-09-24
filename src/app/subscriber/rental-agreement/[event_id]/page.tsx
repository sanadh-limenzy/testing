import RentalAgreementPage from "@/components/rental-agreement/RentalAgreementPage";

export default async function Page({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;

  return <RentalAgreementPage eventId={event_id} />;
}
