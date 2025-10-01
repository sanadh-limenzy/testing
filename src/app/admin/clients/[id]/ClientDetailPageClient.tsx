"use client";

import { useClient } from "@/hooks/useClients";
import { ClientDetailClient } from "./ClientDetailClient";

interface ClientDetailPageClientProps {
  clientId: string;
}

export function ClientDetailPageClient({ clientId }: ClientDetailPageClientProps) {
  const { 
    data: clientData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useClient(clientId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8 font-medium">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading client details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-white p-8 font-medium">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Client</h2>
            <p className="text-gray-600 mb-6">
              {error?.message || "Something went wrong while loading the client details."}
            </p>
            <button
              onClick={() => refetch()}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientData?.data) {
    return (
      <div className="min-h-screen bg-white p-8 font-medium">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h2>
            <p className="text-gray-600">The client you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return <ClientDetailClient client={clientData.data} />;
}
