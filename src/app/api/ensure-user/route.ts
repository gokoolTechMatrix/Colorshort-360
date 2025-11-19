import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getRoleFromEmail } from "@/lib/role-map";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email and password are required." },
        { status: 400 },
      );
    }

    const roleSlug = getRoleFromEmail(email);
    if (!roleSlug) {
      return NextResponse.json(
        { ok: false, message: "Email is not authorized for auto provisioning." },
        { status: 403 },
      );
    }

    const supabase = getServiceRoleClient();

    const { data: existingUser, error: lookupError } = await supabase
      .from("auth.users")
      .select("id, raw_user_meta_data")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (!existingUser) {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          role: roleSlug,
        },
      });

      if (createError) {
        throw createError;
      }
    } else {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          user_metadata: {
            ...(existingUser.raw_user_meta_data ?? {}),
            role: roleSlug,
          },
        },
      );

      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to ensure user.";
    return NextResponse.json(
      { ok: false, message },
      {
        status: 500,
      },
    );
  }
}
