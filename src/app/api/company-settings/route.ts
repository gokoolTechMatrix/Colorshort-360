import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

type TrustFlag = "gold" | "silver" | "bronze";

type CompanySettingsPayload = {
  company_name?: string;
  logo_url?: string;
  registered_address?: string;
  operational_address?: string;
  gst_number?: string;
  pan_number?: string;
  industry_type?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_website?: string;
  description?: string;
  financial_year_start?: string;
  financial_year_end?: string;
};

type TeamMemberPayload = {
  id?: string;
  name?: string;
  employee_id?: string;
  role?: string;
  trust_flag?: TrustFlag;
};

const SINGLETON_ID = "company";
const TRUST_FLAGS: TrustFlag[] = ["gold", "silver", "bronze"];

export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data: settings } = await supabase
      .from("company_settings")
      .select("*")
      .eq("id", SINGLETON_ID)
      .maybeSingle();

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name", { ascending: true });
    if (profileError) {
      throw profileError;
    }

    const { data: teamRows, error: teamError } = await supabase
      .from("company_team_members")
      .select("id, name, employee_id, role, trust_flag");
    if (teamError) {
      throw teamError;
    }

    const normalizeTrust = (value?: string | null): TrustFlag => {
      if (!value) return "gold";
      if (value === "green") return "gold";
      if (value === "yellow") return "silver";
      if (value === "red") return "bronze";
      return TRUST_FLAGS.includes(value as TrustFlag)
        ? (value as TrustFlag)
        : "gold";
    };

    const teamMap = new Map((teamRows ?? []).map((row) => [row.id, row]));

    const combined =
      profiles?.map((profile) => ({
        id: profile.id,
        name: teamMap.get(profile.id)?.name ?? profile.full_name ?? "",
        employee_id: teamMap.get(profile.id)?.employee_id ?? "",
        role:
          teamMap.get(profile.id)?.role ??
          profile.role ??
          "",
        trust_flag: normalizeTrust(teamMap.get(profile.id)?.trust_flag),
      })) ?? [];

    // include any existing manual rows that don't match a profile id
    (teamRows ?? []).forEach((row) => {
      if (!combined.find((entry) => entry.id === row.id)) {
        combined.push({
          id: row.id,
          name: row.name ?? "",
          employee_id: row.employee_id ?? "",
          role: row.role ?? "",
          trust_flag: normalizeTrust(row.trust_flag),
        });
      }
    });

    return NextResponse.json({
      settings: settings ?? null,
      team: combined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load company data.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { settings } = (await request.json()) as {
      settings?: CompanySettingsPayload;
    };

    if (!settings) {
      return NextResponse.json(
        { message: "Settings payload is required." },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();
    const sanitizeDate = (value?: string) =>
      value && value.trim().length > 0 ? value : null;
    const payload = {
      id: SINGLETON_ID,
      ...settings,
      financial_year_start: sanitizeDate(settings.financial_year_start),
      financial_year_end: sanitizeDate(settings.financial_year_end),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("company_settings")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save settings.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { teamMember } = (await request.json()) as {
      teamMember?: TeamMemberPayload;
    };
    if (!teamMember) {
      return NextResponse.json(
        { message: "Team member payload is required." },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();
    const trustFlagInput = (teamMember.trust_flag ?? "gold") as TrustFlag;
    const trustFlag = TRUST_FLAGS.includes(trustFlagInput)
      ? trustFlagInput
      : "gold";
    // Align with legacy DB enum (green/yellow/red) if needed.
    const trustFlagDb =
      trustFlag === "gold"
        ? "green"
        : trustFlag === "silver"
          ? "yellow"
          : "red";

    // Reflect edits back to profiles when an id is provided
    if (teamMember.id && (teamMember.name || teamMember.role)) {
      const profileUpdate: Record<string, string> = {};
      if (teamMember.name) {
        profileUpdate.full_name = teamMember.name;
      }
      if (teamMember.role) {
        profileUpdate.role = teamMember.role;
      }
      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", teamMember.id);
        if (profileUpdateError) {
          throw profileUpdateError;
        }
      }
    }

    const upsertId = teamMember.id?.trim();
    const upsertPayload: {
      id?: string;
      name: string;
      employee_id: string;
      role: string;
      trust_flag: string;
      updated_at: string;
    } = {
      name: teamMember.name ?? "",
      employee_id: teamMember.employee_id ?? "",
      role: teamMember.role ?? "",
      trust_flag: trustFlagDb,
      updated_at: new Date().toISOString(),
    };
    if (upsertId && upsertId.length > 0) {
      upsertPayload.id = upsertId;
    }

    const { error } = await supabase
      .from("company_team_members")
      .upsert(upsertPayload, { onConflict: "id" });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save team member.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return NextResponse.json(
        { message: "Team member id is required." },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from("company_team_members")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete team member.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
