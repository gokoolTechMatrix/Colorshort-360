This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase wiring

1. Copy `.env.example` to `.env.local` and populate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. These values come from your Supabase dashboard.
2. Install the Supabase client dependency if it is not already installed:
   ```bash
   npm install
   ```
3. `src/lib/supabase/` exposes helpers for browser and server contexts, while `src/app/api/supabase-test/route.ts` provides a quick API probe you can call from the browser (`/api/supabase-test`) to make sure the environment variables are correct.
4. The `user-creation` page now signs new operational users up through Supabase Auth and stores the metadata you provide into the user's profile.
   - If you created the `profiles` trigger before this update, run the following SQL once in Supabase so the table also captures the derived email address:
     ```sql
     alter table public.profiles add column if not exists email text not null default '';

     create or replace function public.handle_new_user()
     returns trigger
     language plpgsql
     security definer
     set search_path = public
     as $$
     begin
       insert into public.profiles (id, full_name, phone, role, address, email)
       values (
         new.id,
         coalesce(new.raw_user_meta_data->>'full_name', ''),
         coalesce(new.raw_user_meta_data->>'phone', ''),
         coalesce(new.raw_user_meta_data->>'role', ''),
         coalesce(new.raw_user_meta_data->>'address', ''),
         coalesce(new.raw_user_meta_data->>'email', '')
       );
       return new;
     end;
     $$;
   ```
5. Users now authenticate through `/login`. Enter the email that mirrors your phone number (e.g. `9876543210@gmail.com`) plus password. Super admins land on `/dashboard/admin`, while every other role is redirected automatically to `/dashboard/<role-slug>` with a tailored dashboard. The sidebar “Logout” button ends the Supabase session everywhere.
6. If you need to seed or reset the dedicated super admin (default email `admin@qube.com`), run:
   ```bash
   npm run reset:super-admin
   ```
   The script uses `SUPABASE_SERVICE_ROLE_KEY` to create the account (if missing) and force the password to `admin@123`. Override the email or password via `SUPER_ADMIN_EMAIL` / `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` env vars when running the command.
7. Once signed in as super admin, open `/user-creation` to rotate the admin password from the UI. The “High security” card at the top posts to `/api/admin-reset`, forcing the change in Supabase Auth so the new password works immediately after signing out/in.

## MCP server commands

This project does not bundle the MCP server itself. Point the helper scripts at your MCP server checkout:

1. Copy `.env.example` to `.env.local` (or `.env`) and set `MCP_SERVER_PATH` to the absolute or relative path of your MCP server, and `MCP_DATABASE_URL` to the Postgres connection string it should use.
2. To run the MCP server locally:
   ```bash
   npm run mcp:dev
   ```
   This proxies to the server command defined in `MCP_SERVER_COMMAND` (defaults to `pnpm dev`).
3. To run MCP database migrations:
   ```bash
   npm run mcp:migrate
   ```
   This proxies to `MCP_MIGRATION_COMMAND` (defaults to `pnpm db:migrate`) from the same server path.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
