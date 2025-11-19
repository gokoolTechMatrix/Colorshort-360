import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ??
  "admin@qube.com";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();
    const { data: userRow, error: lookupError } = await supabase
      .from("auth.users")
      .select("id, raw_user_meta_data")
      .eq("email", SUPER_ADMIN_EMAIL)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (!userRow) {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: SUPER_ADMIN_EMAIL,
        email_confirm: true,
        password,
        user_metadata: {
          full_name: "Super Administrator",
          role: "super_admin",
        },
      });
      if (createError) {
        throw createError;
      }
      return NextResponse.json({ ok: true });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userRow.id,
      {
        password,
        user_metadata: {
          ...(userRow.raw_user_meta_data ?? {}),
          role: "super_admin",
        },
      },
    );

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reset password.";
    return NextResponse.json(
      { ok: false, message },
      {
        status: 500,
      },
    );
  }
}
