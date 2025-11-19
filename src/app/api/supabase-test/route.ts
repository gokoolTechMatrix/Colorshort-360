import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      hydratedUsers: data?.users.length ?? 0,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Supabase error";
    return NextResponse.json(
      { ok: false, message },
      {
        status: 500,
      },
    );
  }
}
