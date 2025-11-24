import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        const { email, phone, password, fullName, role, address } =
            await request.json();

        if (!email || !password || !fullName || !role) {
            return NextResponse.json(
                { ok: false, message: "Missing required fields" },
                { status: 400 },
            );
        }

        const supabase = getServiceRoleClient();

        // Create user with admin API (doesn't affect current session)
        const { data: newUser, error: createError } =
            await supabase.auth.admin.createUser({
                email: email.toLowerCase(),
                phone: phone || undefined,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    phone: phone || null,
                    role,
                    address: address || null,
                    email: email.toLowerCase(),
                },
            });

        if (createError) {
            throw createError;
        }

        // Also create profile entry if needed
        if (newUser.user) {
            await supabase.from("profiles").upsert(
                {
                    id: newUser.user.id,
                    full_name: fullName,
                    role,
                },
                { onConflict: "id" },
            );
        }

        return NextResponse.json({
            ok: true,
            user: {
                email: email.toLowerCase(),
                fullName,
                role,
            },
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to create user";
        return NextResponse.json({ ok: false, message }, { status: 500 });
    }
}
