"use client";

import { FolderOpen, Download, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaxPacketTableSkeleton } from "@/components/skeletons/TaxPacketTableSkeleton";

export interface TaxPacket {
  id: string;
  year: string;
  pdf_path: string | null;
  events_csv_link: string | null;
  total_events: number;
  amount: number;
  is_mail_sent: boolean;
  created_at: string;
  status: string;
}

interface TaxPacketTabProps {
  isLoading: boolean;
  taxPackets: TaxPacket[];
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export function TaxPacketTab({ isLoading, taxPackets }: TaxPacketTabProps) {
  if (isLoading) {
    return <TaxPacketTableSkeleton />;
  }

  if (taxPackets.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 md:p-16 text-center min-h-[400px] flex flex-col items-center justify-center">
        <FolderOpen className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mb-4" />
        <p className="text-lg md:text-xl text-gray-600 font-medium">
          No Result Found
        </p>
        <p className="text-sm md:text-base text-gray-500 mt-2">
          No tax packets available for this client
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Year</TableHead>
              <TableHead className="font-bold">Events</TableHead>
              <TableHead className="font-bold">Amount</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Created</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxPackets.map((packet) => (
              <TableRow key={packet.id}>
                <TableCell className="font-medium">{packet.year}</TableCell>
                <TableCell>{packet.total_events || 0}</TableCell>
                <TableCell>{formatCurrency(packet.amount || 0)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      packet.is_mail_sent
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {packet.is_mail_sent ? "Sent" : packet.status || "Draft"}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(packet.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {packet.pdf_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-8"
                      >
                        <Link href={packet.pdf_path} target="_blank">
                          <FileText className="w-4 h-4 mr-1" />
                          PDF
                        </Link>
                      </Button>
                    )}
                    {packet.events_csv_link && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-8"
                      >
                        <Link href={packet.events_csv_link} target="_blank">
                          <Download className="w-4 h-4 mr-1" />
                          CSV
                        </Link>
                      </Button>
                    )}
                    {!packet.pdf_path && !packet.events_csv_link && (
                      <span className="text-sm text-gray-400">No files</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

