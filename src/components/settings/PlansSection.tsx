import { Button } from "../ui/button";
import { PlanDatabase } from "@/@types";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "../ui";
import {
  UpdateSubscriberData,
  useSubscriberUpdate,
} from "@/hooks/useSubscriberUpdate";
import { useUserData } from "@/hooks/useUserData";

interface PlansSectionProps {
  initialData?: PlanDatabase[];
  currentPlan?: string;
  isAutoRenewSubscription?: boolean;
}

export function PlansSection({
  initialData,
  currentPlan,
  isAutoRenewSubscription,
}: PlansSectionProps) {
  const { userData, refetch, isLoading: isLoadingUserData } = useUserData(false);

  const [plans, setPlans] = useState(
    initialData && initialData.length > 0 ? initialData : []
  );

  const [expandedTerms, setExpandedTerms] = useState(false);

  const { mutateAsync: updateSubscriber, isPending: isUpdatingSubscriber } =
    useSubscriberUpdate();

  useEffect(() => {
    if (initialData && initialData.length > 0 && currentPlan) {
      setPlans(initialData.filter((plan) => plan.plan_type === "Premium"));
    }
  }, [initialData, currentPlan, isAutoRenewSubscription]);

  const handleUpdateSubscriber = async (data: UpdateSubscriberData) => {
    await updateSubscriber(data);
    await refetch();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 underline underline-offset-8 decoration-blue-500 pb-1 mb-3">
        Plans
      </h2>
      <div className="">
        {plans && plans.length > 0 ? (
          <div className="flex items-center justify-evenly gap-4 flex-wrap">
            {plans.map((plan: PlanDatabase) => (
              <Card key={plan.id} className="p-6 w-[35rem]">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl text-gray-900 font-eb-garamond font-medium">
                      {plan.plan_type === "Premium"
                        ? "Premium - Free Money Plan"
                        : plan.plan_type}
                    </h3>
                    {currentPlan === plan.id && (
                      <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="">
                  <p className="text-gray-700 font-medium">{plan.title}</p>
                  <p className="text-gray-600 text-sm">Billed per year,</p>
                  <p className="text-gray-600 text-sm">
                    Subscription ends Dec 31, {new Date().getFullYear()}
                  </p>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-4xl font-bold text-gray-900">$0</span>
                    <span className="text-orange-600 text-xs font-medium">
                      includes unlimited residences!
                    </span>
                  </div>
                  <p className="text-gray-700">
                    $500 skin-in-the-game deposit required
                  </p>
                </div>

                {/* Action Button */}
                <div>
                  {userData?.subscriberProfile?.is_auto_renew_subscription ? (
                    <Button
                      variant="destructive"
                      className="px-6 py-2 w-full"
                      disabled={isUpdatingSubscriber || isLoadingUserData}
                      onClick={() =>
                        handleUpdateSubscriber({
                          is_auto_renew_subscription: false,
                        })
                      }
                    >
                      {isUpdatingSubscriber || isLoadingUserData ? "Disabling..." : "Disable Auto-Renew"}
                    </Button>
                  ) : (
                    <Button
                      className="px-6 py-2 w-full"
                      disabled={isUpdatingSubscriber || isLoadingUserData}
                      onClick={() =>
                        handleUpdateSubscriber({
                          is_auto_renew_subscription: true,
                        })
                      }
                    >
                      {isUpdatingSubscriber || isLoadingUserData ? "Enabling..." : "Enable Auto-Renew"}
                    </Button>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                    <li>
                      One-time 45-minute onboarding, then less than 4 hours
                      annually from your designated team member so you can focus
                      on what matters most.
                    </li>
                    <li>We then do all the paperwork for your Tax Pro</li>
                    <li>
                      Custom rental valuations and all 14 events pre-scheduled
                      to maximize the use of the Augusta Rule.
                    </li>
                    <li>100% Money-back guarantee.</li>
                    <li>Audit Protection Guarantee</li>
                  </ul>
                </div>

                {/* Terms Section */}
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setExpandedTerms(!expandedTerms)}
                    className="flex items-center gap-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
                  >
                    <span></span>
                    Terms
                    {expandedTerms ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {expandedTerms && (
                    <div className="mt-4 space-y-3 text-sm text-gray-600">
                      <p className="font-semibold text-gray-900">
                        $500 Fully-Refundable Deposit
                      </p>
                      <p>
                        By submitting payment, you acknowledge and agree to the
                        following terms:
                      </p>
                      <ul className="space-y-2 ml-4 list-disc pl-5">
                        <li>
                          The $500 deposit is fully refundable if you complete
                          the Strategy Call and choose not to move forward.
                        </li>
                        <li>
                          If you cancel with less than 24 hours&apos; notice or
                          fail to attend the call, the deposit is forfeited.
                        </li>
                        <li>
                          If you proceed with our service, the deposit is
                          applied toward your first annual subscription fee and
                          becomes non-refundable.
                        </li>
                        <li>
                          Initiating a chargeback in violation of these terms is
                          considered a breach of our agreement and may result in
                          termination of service.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer Link */}
                <div className="flex justify-end">
                  <Button
                    variant="link"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                  >
                    Buy for a different year
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No plans available</p>
        )}
      </div>
    </div>
  );
}
