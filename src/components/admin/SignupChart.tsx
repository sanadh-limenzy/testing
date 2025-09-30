"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SignupChartData {
  date: string;
  signups: number;
}

interface SignupChartProps {
  data: SignupChartData[];
  weekOverWeekChange: number;
}

export function SignupChart({ data, weekOverWeekChange }: SignupChartProps) {
  // Format date for display (e.g., "Sep 23")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: SignupChartData;
    }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-600 mb-1">
            {formatDate(payload[0].payload.date)}
          </p>
          <p className="text-sm font-semibold flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            Signups: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format X-axis labels to show only a few dates
  const formatXAxis = (tickItem: string, index: number) => {
    // Show dates at intervals (beginning, middle, end)
    if (
      index === 0 ||
      index === Math.floor(data.length / 2) ||
      index === data.length - 1
    ) {
      return formatDate(tickItem);
    }
    return "";
  };

  const changeText =
    weekOverWeekChange > 0
      ? `Up ${weekOverWeekChange} signed up users by this time last week`
      : weekOverWeekChange < 0
      ? `Down ${Math.abs(weekOverWeekChange)} signed up users by this time last week`
      : "No change in signed up users by this time last week";

  return (
    <div className=" rounded-lg p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Signed up users</h2>
        <p className="text-sm text-gray-600">{changeText}</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="signups"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
