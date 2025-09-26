"use client";

import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useUpdateNotificationSettings,
  useResetNotificationSettings,
} from "@/hooks/useNotificationSettings";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { UserNotificationSettings } from "@/@types";

interface NotificationSettingsSectionProps {
  initialData?: UserNotificationSettings | null;
}

interface NotificationItem {
  key: keyof Omit<
    UserNotificationSettings,
    "id" | "user_id" | "created_at" | "updated_at"
  >;
  label: string;
  category: "event" | "app" | "content";
}

const notificationItems: NotificationItem[] = [
  // Event Notifications
  {
    key: "pre_event_email_notifications",
    label: "Pre-event email notifications",
    category: "event",
  },
  {
    key: "during_event_email_notifications",
    label: "During-event email notifications",
    category: "event",
  },
  {
    key: "post_event_email_notifications",
    label: "Post-event email notifications",
    category: "event",
  },
  {
    key: "high_upcoming_rental_event_price",
    label: "High upcoming rental event price",
    category: "event",
  },
  // App Notifications
  {
    key: "using_the_app_tax_pro",
    label: "Using the app tax pro",
    category: "app",
  },
  {
    key: "tax_code_questions",
    label: "Tax code questions",
    category: "app",
  },
  {
    key: "annual_filing",
    label: "Annual filing",
    category: "app",
  },
  // Content Notifications
  {
    key: "best_practices_posts",
    label: "Best practices posts",
    category: "content",
  },
  {
    key: "money_savings_posts",
    label: "Money savings posts",
    category: "content",
  },
  {
    key: "tax_law_posts",
    label: "Tax law posts",
    category: "content",
  },
  {
    key: "time_savings_posts",
    label: "Time savings posts",
    category: "content",
  },
];

export function NotificationSettingsSection({
  initialData,
}: NotificationSettingsSectionProps) {
  const updateSettings = useUpdateNotificationSettings();
  const resetSettings = useResetNotificationSettings();
  const [isResetting, setIsResetting] = useState(false);
  const [currentSettings, setCurrentSettings] = useState(initialData);

  useEffect(() => {
    setCurrentSettings(initialData);
  }, [initialData]);

  const handleToggle = async (
    key: keyof Omit<
      UserNotificationSettings,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
    currentValue: boolean
  ) => {
    try {
      await updateSettings.mutateAsync({
        [key]: !currentValue,
      });
    } catch (error) {
      console.error("Error updating notification setting:", error);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetSettings.mutateAsync();
    } catch (error) {
      console.error("Error resetting notification settings:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const eventNotifications = notificationItems.filter(
    (item) => item.category === "event"
  );
  const appNotifications = notificationItems.filter(
    (item) => item.category === "app"
  );
  const contentNotifications = notificationItems.filter(
    (item) => item.category === "content"
  );

  return (
    <Card className="p-6 bg-white shadow-sm border border-gray-200">
      <div className="space-y-8">
        {/* Section Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 underline underline-offset-8 decoration-orange-500 pb-1 mb-3">
            Notifications
          </h2>
          <p className="text-gray-600 text-sm">
            Toggle on or off what you would like to be notified by email about.
          </p>
        </div>

        {/* Event Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
            Event Notifications
          </h3>
          <div className="space-y-4">
            {eventNotifications.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.label}
                  </p>
                </div>
                <div className="ml-4">
                  <Switch
                    checked={currentSettings?.[item.key] ?? false}
                    onCheckedChange={() =>
                      handleToggle(
                        item.key,
                        currentSettings?.[item.key] ?? false
                      )
                    }
                    disabled={updateSettings.isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* App Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
            App Notifications
          </h3>
          <div className="space-y-4">
            {appNotifications.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.label}
                  </p>
                </div>
                <div className="ml-4">
                  <Switch
                    checked={currentSettings?.[item.key] ?? false}
                    onCheckedChange={() =>
                      handleToggle(
                        item.key,
                        currentSettings?.[item.key] ?? false
                      )
                    }
                    disabled={updateSettings.isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
            Content Notifications
          </h3>
          <div className="space-y-4">
            {contentNotifications.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.label}
                  </p>
                </div>
                <div className="ml-4">
                  <Switch
                    checked={currentSettings?.[item.key] ?? false}
                    onCheckedChange={() =>
                      handleToggle(
                        item.key,
                        currentSettings?.[item.key] ?? false
                      )
                    }
                    disabled={updateSettings.isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleReset}
            disabled={isResetting || resetSettings.isPending}
            variant="outline"
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
          >
            {isResetting || resetSettings.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Notifications to Default"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
