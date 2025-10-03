import { adminSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentsClient from "./DocumentsClient";

// Type definitions for better type safety
interface EventCreator {
  id: string;
  first_name: string;
  last_name: string;
}

interface Event {
  id: string;
  title: string;
  created_by: EventCreator;
}

interface EventDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  created_at: string;
  events: Event;
}

interface Proposal {
  id: string;
  form_type: string;
  created_at: string;
  signature_doc_url: string | null;
  is_signature_done: boolean;
  event_id: string;
  events: Event;
}

interface EventWithInvoice {
  id: string;
  title: string;
  created_by: EventCreator;
  event_invoices: {
    id: string;
    url: string | null;
    created_at: string;
  };
}

interface Document {
  id: string;
  name: string;
  eventName: string;
  eventId: string;
  userId: string;
  userName: string;
  type: "supportive" | "rental_agreement" | "reimbursement_plan" | "invoice";
  url?: string;
  createdAt: string;
  isSigned?: boolean;
}

async function getDocuments() {
  const supabase = await adminSupabaseServerClient();

  try {
    // Fetch all document types in parallel for better performance
    const [
      eventDocsResult,
      rentalAgreementsResult,
      reimbursementPlansResult,
      invoicesResult,
    ] = await Promise.all([
      // Fetch event documents (supportive documents)
      supabase
        .from("event_documents")
        .select(
          `
            id,
            name,
            url,
            type,
            created_at,
            events!inner (
              id,
              title,
              created_by!inner (
                id,
                first_name,
                last_name
              )
            )
          `
        )
        .order("created_at", { ascending: false }),

      // Fetch rental agreements
      supabase
        .from("proposals")
        .select(
          `
            id,
            form_type,
            created_at,
            signature_doc_url,
            is_signature_done,
            event_id,
            events!fk_proposals_event!inner (
              id,
              title,
              created_by!inner (
                id,
                first_name,
                last_name
              )
            )
          `
        )
        .eq("form_type", "Rental_Agreement")
        .order("created_at", { ascending: false }),

      // Fetch reimbursement plans
      supabase
        .from("proposals")
        .select(
          `
            id,
            form_type,
            created_at,
            signature_doc_url,
            is_signature_done,
            event_id,
            events!fk_proposals_event!inner (
              id,
              title,
              created_by!inner (
                id,
                first_name,
                last_name
              )
            )
          `
        )
        .eq("form_type", "Reimbursement_Plan")
        .order("created_at", { ascending: false }),

      // Fetch invoices via events table
      supabase
        .from("events")
        .select(
          `
            id,
            title,
            created_by!inner (
              id,
              first_name,
              last_name
            ),
            event_invoices!events_event_invoice_id_fkey!inner (
              id,
              url,
              created_at
            )
          `
        )
        .not("event_invoice_id", "is", null)
        .order("created_at", { ascending: false }),
    ]);

    const documents: Document[] = [];

    // Process event documents
    if (eventDocsResult.data) {
      const eventDocs = (
        eventDocsResult.data as unknown as EventDocument[]
      ).map((doc) => ({
        id: doc.id,
        name: doc.name || "Supportive Document",
        eventName: doc.events.title,
        eventId: doc.events.id,
        userId: doc.events.created_by.id,
        userName:
          `${doc.events.created_by.first_name || ""} ${
            doc.events.created_by.last_name || ""
          }`.trim() || "Unknown User",
        type: "supportive" as const,
        url: doc.url,
        createdAt: doc.created_at,
      }));
      documents.push(...eventDocs);
    }

    // Process rental agreements
    if (rentalAgreementsResult.data) {
      const rentalDocs = (
        rentalAgreementsResult.data as unknown as Proposal[]
      ).map((proposal) => ({
        id: proposal.id,
        name: "Rental Agreement",
        eventName: proposal.events.title,
        eventId: proposal.events.id,
        userId: proposal.events.created_by.id,
        userName:
          `${proposal.events.created_by.first_name || ""} ${
            proposal.events.created_by.last_name || ""
          }`.trim() || "Unknown User",
        type: "rental_agreement" as const,
        url: proposal.signature_doc_url || undefined,
        createdAt: proposal.created_at,
        isSigned: proposal.is_signature_done,
      }));
      documents.push(...rentalDocs);
    }

    // Process reimbursement plans
    if (reimbursementPlansResult.data) {
      const reimbursementDocs = (
        reimbursementPlansResult.data as unknown as Proposal[]
      ).map((proposal) => ({
        id: proposal.id,
        name: "Reimbursement Plan",
        eventName: proposal.events.title,
        eventId: proposal.events.id,
        userId: proposal.events.created_by.id,
        userName:
          `${proposal.events.created_by.first_name || ""} ${
            proposal.events.created_by.last_name || ""
          }`.trim() || "Unknown User",
        type: "reimbursement_plan" as const,
        url: proposal.signature_doc_url || undefined,
        createdAt: proposal.created_at,
        isSigned: proposal.is_signature_done,
      }));
      documents.push(...reimbursementDocs);
    }

    // Process invoices
    if (invoicesResult.data) {
      const invoiceDocs = (invoicesResult.data as unknown as EventWithInvoice[])
        .filter((event) => event.event_invoices) // Only include events with invoices
        .map((event) => ({
          id: event.event_invoices.id,
          name: "Invoice",
          eventName: event.title,
          eventId: event.id,
          userId: event.created_by.id,
          userName:
            `${event.created_by.first_name || ""} ${
              event.created_by.last_name || ""
            }`.trim() || "Unknown User",
          type: "invoice" as const,
          url: event.event_invoices.url || undefined,
          createdAt: event.event_invoices.created_at,
        }));
      documents.push(...invoiceDocs);
    }

    // Sort all documents by creation date (newest first)
    documents.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { documents, error: null };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return {
      documents: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch documents",
    };
  }
}

async function getUsers() {
  const supabase = await adminSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("id, first_name, last_name")
      // push null/empty first_name to the bottom
      .order("first_name", {
        ascending: true,
        nullsFirst: false, // ensures NULLs go last
      })
      .order("last_name", {
        ascending: true,
        nullsFirst: false, // ensures NULLs go last
      });

    if (error) throw error;

    return (data || []).map((user) => ({
      id: user.id,
      name:
        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
        "Unknown User",
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function DocumentsPage({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{
    year?: string;
    userId?: string;
    search?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;
  const [{ documents, error }, users] = await Promise.all([
    getDocuments(),
    getUsers(),
  ]);

  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive text-lg md:text-xl">
              Error Loading Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm md:text-base">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unknownUsers = users.filter((user) => user.name === "Unknown User");
  const knownUsers = users.filter((user) => user.name !== "Unknown User");
  const allUsers = [...knownUsers, ...unknownUsers];

  return (
    <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          View all documents, rental agreements, reimbursement plans, and
          invoices
        </p>
      </div>

      <DocumentsClient
        initialDocuments={documents}
        users={allUsers}
        initialYear={searchParams?.year}
        initialUserId={searchParams?.userId}
        initialSearch={searchParams?.search}
      />
    </div>
  );
}
