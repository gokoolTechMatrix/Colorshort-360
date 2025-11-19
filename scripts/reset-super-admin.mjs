#!/usr/bin/env node
/**
 * Utility script to force reset the super admin password through Supabase.
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
 */

import { createClient } from "@supabase/supabase-js";

const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL?.toLowerCase() ??
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ??
  "admin@qube.com";
const NEW_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? "admin@123";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log(`[reset-super-admin] Looking up ${SUPER_ADMIN_EMAIL}`);
  const { data: userRow, error: lookupError } = await supabase
    .from("auth.users")
    .select("id, raw_user_meta_data")
    .eq("email", SUPER_ADMIN_EMAIL)
    .maybeSingle();

  if (lookupError) {
    console.error(
      `[reset-super-admin] Failed to query auth.users: ${lookupError.message}`,
    );
  }

  let superAdminId = userRow?.id;

  if (!superAdminId) {
    console.log(
      `[reset-super-admin] No user found. Creating new super admin (${SUPER_ADMIN_EMAIL}).`,
    );
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email: SUPER_ADMIN_EMAIL,
        password: NEW_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: "Super Administrator",
          role: "super_admin",
        },
      });
    if (createError) {
      console.error(
        `[reset-super-admin] Unable to create super admin: ${createError.message}`,
      );
      process.exit(1);
    }
    superAdminId = created.user?.id ?? undefined;
  }

  if (!superAdminId) {
    console.error("[reset-super-admin] Unable to determine user id.");
    process.exit(1);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    superAdminId,
    {
      password: NEW_PASSWORD,
      user_metadata: {
        ...(userRow?.raw_user_meta_data ?? {}),
        full_name: "Super Administrator",
        role: "super_admin",
      },
    },
  );

  if (updateError) {
    console.error(
      `[reset-super-admin] Unable to reset password: ${updateError.message}`,
    );
    process.exit(1);
  }

  console.log(
    `[reset-super-admin] Password updated. You can now log in as ${SUPER_ADMIN_EMAIL} with password "${NEW_PASSWORD}".`,
  );
}

main().catch((error) => {
  console.error("[reset-super-admin] Unexpected error", error);
  process.exit(1);
});
