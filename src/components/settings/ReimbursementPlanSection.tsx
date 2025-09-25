"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ProposalDatabase } from "@/@types";
import Link from "next/link";

export function ReimbursementPlanSection({
  alreadyHaveReimbursementPlan,
  reimbursementPlan,
}: {
  alreadyHaveReimbursementPlan: boolean;
  reimbursementPlan?: ProposalDatabase | null;
}) {

  return (
    <Card className="p-6 bg-white shadow-sm border border-gray-200">
      <div className="space-y-6">
        {/* Section Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 underline underline-offset-8 decoration-red-500 pb-1 mb-3">
            Reimbursement Plan
          </h2>
          <p className="text-gray-600 text-sm">
            A reimbursement plan protects you in the event of an audit.
          </p>
        </div>

        {/* Toggle Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Already have a reimbursement plan:
            </label>
            <Switch
              checked={alreadyHaveReimbursementPlan}
              onCheckedChange={() => {}}
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <Button
              asChild
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2"
            >
              <Link href="/subscriber/reimbursement-plan">
                {reimbursementPlan?.is_signature_done
                  ? "View / update signature"
                  : "Sign or upload reimbursement plan"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
