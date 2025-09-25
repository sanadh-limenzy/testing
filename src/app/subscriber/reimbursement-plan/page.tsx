import ReimbursementPlanPage from "@/components/reimbursement-plan/ReimbursementPlanPage";
import { env } from "@/env";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const revalidate = 0;

export default async function Page() {
  const cookieStore = await cookies();

  const response = await fetch(
    env.NEXT_PUBLIC_APP_URL + "/api/subscriber/pdf/reimbursement-plan-form",
    {
      headers: {
        Cookie: cookieStore.toString(),
      },
    }
  );
  const reimbursementPlanData = await response.json();

  if (!response.ok) {
    return <div>Failed to fetch reimbursement plan</div>;
  }
  if (!reimbursementPlanData.success) {
    return <div>Failed to fetch reimbursement plan</div>;
  }

  return (
    <ReimbursementPlanPage reimbursementPlanData={reimbursementPlanData.data} />
  );
}
