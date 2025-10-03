import { adminSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface TaxPacket {
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await adminSupabaseServerClient();
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch tax packets for the user
    const { data: taxPackets, error } = await supabase
      .from("send_packets")
      .select("*")
      .eq("created_by", userId)
      .order("year", { ascending: false });

    if (error) {
      console.error("Error fetching tax packets:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch tax packets" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: taxPackets as TaxPacket[],
    });
  } catch (error) {
    console.error("Error in tax packets API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

