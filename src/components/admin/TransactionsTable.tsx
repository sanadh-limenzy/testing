"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TransactionsPagination } from "./TransactionsPagination";
import { TransactionDatabase } from "@/@types";
import { UserProfile } from "@/@types/user";

type Transaction = TransactionDatabase & {
  user_profile: Pick<UserProfile, "id" | "first_name" | "last_name" | "email">;
  formatted_date?: string;
};

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface TransactionsTableProps {
  initialTransactions: Transaction[];
  initialPagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onRefund: (transactionId: string, reason: string) => void;
  loading?: boolean;
}

export function TransactionsTable({
  initialTransactions,
  initialPagination,
  onPageChange,
  onRefund,
  loading: externalLoading = false,
}: TransactionsTableProps) {
  const [copiedTransactionId, setCopiedTransactionId] = useState<string | null>(
    null
  );

  const handleCopyTransactionId = async (transaction: Transaction) => {
    try {
      await navigator.clipboard.writeText(transaction.transaction_id || "");
      setCopiedTransactionId(transaction.id);
      setTimeout(() => setCopiedTransactionId(null), 2000);
    } catch (error) {
      console.error("Failed to copy transaction ID:", error);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Transaction Id
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Transaction Date
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Done By
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Transaction Type
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Amount
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap w-fit">
              Promo Code Applied
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Status
            </th>
            <th className="text-left py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {externalLoading ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : initialTransactions.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-gray-500">
                No transactions found
              </td>
            </tr>
          ) : (
            initialTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {/* Transaction Id */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {transaction.transaction_id &&
                    transaction.transaction_id.length > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyTransactionId(transaction);
                            }}
                            className="font-mono text-gray-900"
                          >
                            {transaction.transaction_id.slice(0, 8) + "..."}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {copiedTransactionId === transaction.id
                              ? "Transaction ID copied!"
                              : "Copy transaction ID"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </div>
                </td>

                {/* Transaction Date */}
                <td className="py-4 px-6 text-gray-900 whitespace-nowrap">
                  {transaction.formatted_date || "-"}
                </td>

                {/* Done By */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {transaction.user_profile.first_name}{" "}
                        {transaction.user_profile.last_name}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Transaction Type */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <span className=" text-gray-900 capitalize">
                      {transaction.payment_type?.replace("_", " ")}
                    </span>
                  </div>
                </td>

                {/* Amount */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-900">
                      {formatAmount(transaction.amount || 0)}
                    </span>
                  </div>
                </td>

                {/* Promo Code Applied */}
                <td className="py-4 px-6 text-center">
                  <div className=" text-gray-900">
                    {transaction.promo_code && transaction.is_applied_code ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {transaction.promo_code}
                      </Badge>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-6 whitespace-nowrap">
                  {transaction.status}
                </td>

                {/* Action */}
                <td
                  className="py-4 px-6 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-2">
                    {!transaction.is_refunded &&
                      transaction.status === "completed" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-sm"
                          onClick={() =>
                            onRefund(transaction.id, "Admin refund")
                          }
                        >
                          Refund
                        </Button>
                      )}
                    {transaction.is_refunded && (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-600"
                      >
                        Refunded
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {initialPagination.totalPages > 1 && (
        <TransactionsPagination
          currentPage={initialPagination.page}
          totalPages={initialPagination.totalPages}
          onPageChange={onPageChange}
          hasNextPage={initialPagination.hasNextPage}
          hasPreviousPage={initialPagination.hasPreviousPage}
        />
      )}
    </div>
  );
}
