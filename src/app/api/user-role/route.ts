import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getRoleFromEmail } from "@/lib/role-map";
import { resolveRoleFromEmail } from "@/lib/local-auth";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { role: null, message: "userId is required" },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("role, id")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.role) {
      return NextResponse.json({ role: data.role });
    }

    const { data: userResult } = await supabase.auth.admin.getUserById(userId);
    const mappedRole = getRoleFromEmail(userResult?.user?.email ?? undefined);

    return NextResponse.json({ role: mappedRole ?? null });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to read role.";
    // fall back to deterministic role to keep UI working offline
    return NextResponse.json(
      { role: resolveRoleFromEmail("fallback@local"), warning: message },
      { status: 200 },
    );
  }
}
