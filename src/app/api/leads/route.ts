import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

const TABLE = "lead";

const stageFromStatus = (status?: string | null) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized.includes("approve")) return "Pending Approval";
  if (normalized.includes("won")) return "Won";
  if (normalized.includes("lost")) return "Lost";
  if (normalized.includes("discuss")) return "In Discussion";
  if (normalized.includes("new")) return "New";
  return "New";
};

const temperatureFromFlag = (flag?: string | null) => {
  const normalized = (flag ?? "").toLowerCase();
  if (normalized === "hot") return "Hot";
  if (normalized === "cold") return "Cold";
  return "Warm";
};

export async function GET() {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "id, lead_source_, customer_name, contact_person, phone, email, state, purpose_switch, status, gst, hot_cold_flag, next_followup_on, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "Unable to fetch leads", leads: [] },
      { status: 500 },
    );
  }

  const leads =
    data?.map((row) => ({
      id: row.id,
      source: row.lead_source_,
      customer_name: row.customer_name,
      contact_person: row.contact_person,
      phone: row.phone,
      email: row.email,
      state: row.state,
      purpose_switch: row.purpose_switch,
      status: row.status,
      gst: row.gst,
      hot_cold_flag: row.hot_cold_flag,
      next_followup_on: row.next_followup_on,
      created_at: row.created_at,
      stage: stageFromStatus(row.status),
      temperature: temperatureFromFlag(row.hot_cold_flag),
    })) ?? [];

  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const company_id = Number(payload.company_id ?? 1);
    const lead_source_ = (payload.lead_source_ as string | undefined)?.trim() || null;
    const customer_name = (payload.customer_name as string | undefined)?.trim() || null;
    const contact_person = (payload.contact_person as string | undefined)?.trim() || null;
    const phone = (payload.phone as string | undefined)?.trim() || null;
    const email = (payload.email as string | undefined)?.trim() || null;
    const state = (payload.state as string | undefined)?.trim() || null;
    const purpose_switch = (payload.purpose_switch as string | undefined)?.trim() || null;
    const status = (payload.status as string | undefined)?.trim() || "New";
    const gst = (payload.gst as string | undefined)?.trim() || null;
    const hot_cold_flag = (payload.hot_cold_flag as string | undefined)?.trim() || null;
    const next_followup_on = payload.next_followup_on as string | null | undefined;

    if (!company_id || Number.isNaN(company_id)) {
      return NextResponse.json(
        { message: "company_id is required and must be a number." },
        { status: 400 },
      );
    }

    if (!customer_name) {
      return NextResponse.json(
        { message: "Customer/Company name is required." },
        { status: 400 },
      );
    }

    if (!contact_person) {
      return NextResponse.json(
        { message: "Contact person is required." },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();
    const { error, data } = await supabase
      .from(TABLE)
      .insert({
        company_id,
        lead_source_,
        customer_name,
        contact_person,
        phone,
        email,
        state,
        purpose_switch,
        status,
        gst,
        hot_cold_flag,
        outcome: null,
        assigned_to_id: null,
        created_by_id: null,
        next_followup_on: next_followup_on ? new Date(next_followup_on).toISOString() : null,
        customer_id: null,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create lead";
    return NextResponse.json({ message }, { status: 500 });
  }
}
