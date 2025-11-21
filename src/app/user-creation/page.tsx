"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const roles = [
  "Sales Manager",
  "Sales Executive",
  "Sales Co-ordinator",
  "Service Manager",
  "Service Co-ordinator",
  "Service Engineer",
  "Store Incharge",
  "Purchase Manager",
  "Accountant",
];

const iconWrapper = (icon: ReactNode) => (
  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 via-white to-blue-50 text-indigo-500 shadow-inner shadow-white">
    {icon}
  </span>
);

const sidebarLinks = [
  {
    label: "Dashboard Overview",
    href: "/dashboard",
    icon: iconWrapper(
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 13h6V4H4v9Zm10 7h6v-8h-6v8ZM4 20h6v-5H4v5ZM14 4v5h6V4h-6Z" />
      </svg>,
    ),
  },
  {
    label: "User Creation",
    href: "/user-creation",
    icon: iconWrapper(
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-9 13v-1a5 5 0 0 1 5-5h2" />
        <path d="M16 17h6m-3-3v6" />
      </svg>,
    ),
  },
  {
    label: "Product List",
    href: "/product-list",
    icon: iconWrapper(
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
      </svg>,
    ),
  },
  {
    label: "Stock Insights",
    href: "#",
    icon: iconWrapper(
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="m4 15 4-4 4 4 6-6" />
        <path d="M18 9h4v4" />
      </svg>,
    ),
  },
  {
    label: "Client Registry",
    href: "#",
    icon: iconWrapper(
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-4 7c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
      </svg>,
    ),
  },
  {
    label: "Reports & Exports",
    href: "#",
    icon: iconWrapper(
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M7 4h10l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M7 10h10M7 14h6" />
      </svg>,
    ),
  },
  {
    label: "Settings",
    href: "/admin-settings",
    icon: iconWrapper(
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="m4 6 2-2 2 2h8l2-2 2 2-2 2 2 2-2 2 2 2-2 2-2-2h-8l-2 2-2-2 2-2-2-2 2-2-2-2Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>,
    ),
  },
];

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ??
  "admin@qube.com";

export default function UserCreationPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(roles[0]);
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("password");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  const derivedEmail = useMemo(
    () => (phone ? `${phone}@gmail.com` : ""),
    [phone],
  );

  const inputStyles =
    "peer w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 text-sm font-medium text-slate-700 shadow-lg shadow-slate-100 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100";

  useEffect(() => {
    let isMounted = true;

    const hydrateFromSession = async (incomingSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      if (!incomingSession) {
        setProfile(null);
        setIsAuthorized(false);
        setIsCheckingAuth(false);
        router.replace("/login");
        return;
      }

      const metadata = (incomingSession.user.user_metadata ?? {}) as {
        full_name?: string;
        role?: string;
      };

      let fullName = metadata.full_name ?? null;
      let role = metadata.role ?? null;

      if (!role || !fullName) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", incomingSession.user.id)
          .maybeSingle();
        if (!isMounted) {
          return;
        }
        fullName = fullName ?? data?.full_name ?? null;
        role = role ?? data?.role ?? null;
      }

      setProfile({ full_name: fullName });
      const isSuperAdmin =
        incomingSession.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
        (role ?? "super_admin").toLowerCase() === "super_admin";
      setIsAuthorized(isSuperAdmin);
      setIsCheckingAuth(false);
      setStatus(
        isSuperAdmin
          ? null
          : {
              type: "error",
              message: "Only super administrators can create users.",
            },
      );
    };

    supabase.auth.getSession().then(({ data }) => {
      void hydrateFromSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void hydrateFromSession(session);
      },
    );

    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, [supabase, router]);

  useEffect(() => {
    fetch("/api/company-settings")
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as {
          settings?: { logo_url?: string };
        };
        if (payload?.settings?.logo_url) {
          setCompanyLogo(payload.settings.logo_url);
        }
      })
      .catch(() => {
        // best-effort logo
      });
  }, []);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!name || !phone || !derivedEmail || !password) {
      setStatus({
        type: "error",
        message:
          "Full name, phone number, derived email, and a temporary password are required.",
      });
      return;
    }

    if (password.length < 8) {
      setStatus({
        type: "error",
        message: "Temporary password must include at least 8 characters.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: derivedEmail,
        phone,
        password,
        options: {
          data: {
            full_name: name,
            phone,
            role,
            address,
            email: derivedEmail,
          },
        },
      });

      if (error) {
        throw error;
      }

      setStatus({
        type: "success",
        message: derivedEmail,
      });
      resetForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create user.";
      setStatus({
        type: "error",
        message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    setPhone(digitsOnly);
  };

  const resetForm = useCallback(() => {
    setName("");
    setPhone("");
    setRole(roles[0]);
    setAddress("");
    setPassword("password");
  }, []);

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to discard this form?")) {
      resetForm();
      setStatus(null);
    }
  };


  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
    router.replace("/login");
  };


  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <aside className="hidden w-72 border-r border-slate-200 bg-white/80 p-6 lg:flex lg:flex-col">
          <div className="h-16 w-32 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        </aside>
        <main className="flex flex-1 flex-col gap-8 p-10">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="h-8 w-64 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="mx-auto h-full w-full max-w-4xl space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl border border-slate-100 bg-white"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.4em] text-rose-400">
            Restricted
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Super admin access required
          </h1>
          <p className="mt-4 text-sm text-slate-600">
            You are signed in but your role does not allow user provisioning.
            Please contact a super administrator if you believe this is an
            error.
          </p>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="mt-8 w-full rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSigningOut ? "Signing out…" : "Return to login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-white">
        <aside
          className={`relative hidden flex-col border-r border-slate-200 bg-white/95 px-6 pb-6 pt-14 transition-all lg:flex ${
            collapsed ? "w-24" : "w-72"
          }`}
      >
        <button
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:text-indigo-500"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M4 6h16M8 12h12M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center justify-center pb-6">
          <img
            src={companyLogo}
            alt="Color Sort 360 logo"
            className={`object-contain ${collapsed ? "h-14 w-14" : "h-20 w-20"}`}
          />
        </div>

        <nav className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          {sidebarLinks.map((link) => (
            <button
              key={link.label}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-slate-100 ${
                link.href === "/user-creation"
                  ? "bg-indigo-50 text-indigo-600"
                  : ""
              }`}
              onClick={() => link.href !== "#" && router.push(link.href)}
            >
              <span className="text-slate-400">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
            </button>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-auto flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-500">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M3 5h8m0 0v14m0-14 6 6m-6 8 6-6" />
            </svg>
          </span>
          {!collapsed && <span>{isSigningOut ? "Signing out…" : "Logout"}</span>}
        </button>
      </aside>

      <main className="flex-1 p-6 lg:p-12">
        <div className="flex items-center gap-4 pb-6">
          <button
            onClick={() => router.back()}
            className="rounded-full bg-blue-400 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
          >
            Back
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-400">
              User Management
            </p>
            <h1 className="text-4xl font-semibold text-slate-900">
              Create New Team Member
            </h1>
            <p className="text-sm text-slate-500">
              Provide contact information and assign an operational role.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex flex-wrap items-center justify-between rounded-3xl border border-slate-100 bg-indigo-50/60 px-6 py-4 text-sm text-slate-600 shadow-inner shadow-white">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-400">
                Signed in as
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {profile?.full_name ?? "Super Administrator"}
              </p>
            </div>
            <p className="text-xs font-semibold text-indigo-500">
              Role: Super Admin
            </p>
        </div>

          <form
            onSubmit={handleSave}
            className="space-y-8 rounded-[32px] border border-slate-100 bg-white p-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)] transition duration-500 hover:-translate-y-1"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Full Name" htmlFor="name">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter full name"
                  className={inputStyles}
                />
              </Field>

              <Field label="Phone Number" htmlFor="phone">
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+91 98765 43210"
                  className={inputStyles}
                />
              </Field>

              <Field label="Mail ID (auto-generated)" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  readOnly
                  value={derivedEmail}
                  placeholder="Phone based email"
                  className={`${inputStyles} cursor-not-allowed bg-slate-50 text-slate-500`}
                />
              </Field>

              <Field label="Temporary Password" htmlFor="password">
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Min. 8 characters"
                    className={`${inputStyles} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                        <path d="M8.5 8.5C6.4 9.4 4.7 11 3 13c2.7 3.5 6 5.5 9 5.5 1.2 0 2.4-.3 3.5-.7" />
                        <path d="M17.94 17.94C19.8 16.5 21.4 14.7 23 13c-2.7-3.5-6-5.5-9-5.5-.6 0-1.3.1-1.9.2" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </Field>

              <Field label="Role" htmlFor="role">
                <select
                  id="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className={`${inputStyles} cursor-pointer`}
                >
                  {roles.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Address"
                htmlFor="address"
                className="md:col-span-2"
              >
                <textarea
                  id="address"
                  rows={4}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Office address, area, and city"
                  className={`${inputStyles} resize-none`}
                />
              </Field>
            </div>

            {status && status.type === "error" && (
              <div
                role="status"
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
              >
                {status.message}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="ml-auto flex items-center gap-2 rounded-2xl bg-purple-400 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-purple-200 transition hover:translate-y-[1px] hover:bg-purple-300 hover:shadow-purple-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSaving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {isSaving ? "Saving..." : "Save User"}
              </button>
            </div>
          </form>
        </div>
      </main>
      </div>
      {status?.type === "success" && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-lg items-center gap-4 rounded-3xl border border-emerald-200 bg-white/90 p-4 shadow-2xl shadow-emerald-100 ring-1 ring-emerald-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">
                New user created successfully
              </p>
              <p className="text-sm text-slate-500">
                Invitation sent to{" "}
                <span className="font-semibold text-emerald-600">
                  {status.message}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
      >
        {label}
      </label>
      <div className="rounded-[28px] bg-slate-50/80 p-1 shadow-inner shadow-white">
        {children}
      </div>
    </div>
  );
}
