"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getRoleFromEmail } from "@/lib/role-map";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@qube.com";

const slugifyRole = (role?: string | null) =>
  role?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ?? "";

type StoredLead = {
  id: string;
  createdAt: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  state: string;
  city?: string;
  source: string;
  model?: string;
  purpose: string;
  priority: string;
  expectedQty?: string;
};

type ApiLead = {
  id: number | string;
  lead_source_?: string | null;
  customer_name?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  state?: string | null;
  purpose_switch?: string | null;
  hot_cold_flag?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export default function SalesCoordinatorAddLeadPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [profileName, setProfileName] = useState("Team Member");
  const [roleSlug, setRoleSlug] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "new-lead" | "my-leads" | "reports">("new-lead");
  const [leads, setLeads] = useState<StoredLead[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setIsLoadingLeads(true);
    setLeadsError(null);
    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      const payload = (await response.json()) as { leads?: ApiLead[]; message?: string };

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to fetch leads");
      }

      const mapped: StoredLead[] =
        (payload.leads ?? []).map((lead) => ({
          id: String(lead.id ?? `temp-${Math.random().toString(36).slice(2)}`),
          createdAt: lead.created_at ?? new Date().toISOString(),
          companyName: lead.customer_name ?? "Customer",
          contactPerson: lead.contact_person ?? "Contact",
          phone: lead.phone ?? "No phone",
          email: lead.email ?? "",
          state: lead.state ?? "NA",
          city: "",
          source: lead.lead_source_ ?? "App",
          model: "",
          purpose: lead.purpose_switch ?? lead.status ?? "Requirement",
          priority: lead.hot_cold_flag ?? "Warm",
          expectedQty: "",
        })) ?? [];

      setLeads(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fetch leads";
      setLeadsError(message);
    } finally {
      setIsLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

      const user = data.session.user;
      const fetchedRole =
        (user.user_metadata?.role as string | undefined) ??
        getRoleFromEmail(user.email) ??
        (await fetchRole(user.id));
      const slug = slugifyRole(fetchedRole);

      const derivedName =
        (user.user_metadata?.full_name as string | undefined) ?? "Team Member";
      setProfileName(derivedName);
      setRoleSlug(slug || null);

      const allowedCreators = new Set([
        "super-admin",
        "super_admin",
        "admin",
        "sales-manager",
        "sales-co-ordinator",
        "sales-executive",
      ]);

      const isSuperAdminEmail = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

      if (!isSuperAdminEmail && slug && !allowedCreators.has(slug)) {
        router.replace(slug ? `/dashboard/${slug}` : "/dashboard");
        return;
      }

      setIsChecking(false);
    };

    const fetchRole = async (userId: string) => {
      try {
        const response = await fetch("/api/user-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });
        if (!response.ok) {
          return "";
        }
        const payload = (await response.json()) as { role?: string | null };
        return payload.role ?? "";
      } catch {
        return "";
      }
    };

    hydrate();
    return () => {
      active = false;
    };
  }, [router, supabase]);

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
        // best-effort logo fetch
      });
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "my-leads") {
      setActiveTab("my-leads");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (activeTab === "my-leads") {
      fetchLeads();
    }
  }, [activeTab, fetchLeads]);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Loading workspace...
      </div>
    );
  }

  const addLeadBasePath = `/dashboard/${roleSlug || "sales-co-ordinator"}/add-lead`;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        companyLogo={companyLogo}
        onLogout={handleLogout}
        isSigningOut={isSigningOut}
        activeHref={pathname ?? addLeadBasePath}
        showLeadManagement
      />

      <main className="flex-1 px-6 py-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-400">
            Add lead workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Build a new lead flow
          </h1>
        </header>

        <div className="rounded-[28px] bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "dashboard", label: "Dashboard" },
              { key: "new-lead", label: "New Lead" },
              { key: "my-leads", label: "My Leads" },
              { key: "reports", label: "Reports" },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`px-5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "rounded-2xl bg-[#4d95ff] text-white shadow-md shadow-blue-200"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "new-lead" ? (
          <div className="mt-6 rounded-[32px] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner shadow-blue-100">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M12 13a4 4 0 1 0-4-4" />
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  <path d="M14 7a4 4 0 1 1 4 4" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Create New Lead</h2>
              <p className="text-sm text-slate-600">
                Choose the type of client to start the lead creation process.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <LeadOptionCard
                tone="blue"
                title="New Client"
                description="Create a lead for a completely new customer. Add company information, contact details, and requirements."
                onSelect={() => router.push(`${addLeadBasePath}/new`)}
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M12 12a4 4 0 1 0-4-4" />
                    <path d="M6 21v-2a4 4 0 0 1 4-4h1" />
                    <path d="M17 14v6" />
                    <path d="M14 17h6" />
                  </svg>
                }
              />
              <LeadOptionCard
                tone="emerald"
                title="Existing Client"
                description="Create a lead for a customer who has worked with us. Search the database and set up the new opportunity quickly."
                onSelect={() => router.push(`${addLeadBasePath}/new`)}
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M12 12a4 4 0 1 0-4-4" />
                    <path d="M6 21v-2a4 4 0 0 1 4-4h4" />
                    <path d="M17.5 14.5 20 17l-2.5 2.5" />
                  </svg>
                }
              />
            </div>
          </div>
        ) : activeTab === "my-leads" ? (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-indigo-400">
                  My Leads
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Recently created leads
                </h2>
              </div>
              <button
                onClick={async () => {
                  if (isRefreshing || isLoadingLeads) return;
                  setIsRefreshing(true);
                  await fetchLeads();
                  setIsRefreshing(false);
                }}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-50 disabled:opacity-60"
                disabled={isRefreshing || isLoadingLeads}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 ${isRefreshing || isLoadingLeads ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M4 4v6h6" />
                  <path d="M20 20v-6h-6" />
                  <path d="M5 13a7 7 0 0 0 12 3M19 11A7 7 0 0 0 7.05 8.05" />
                </svg>
                Refresh
              </button>
            </div>
            {leadsError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {leadsError}
              </div>
            )}
            {isLoadingLeads && (
              <div className="rounded-2xl border border-slate-200 bg-white/60 p-6 text-sm text-slate-600">
                Loading leads...
              </div>
            )}
            {leads.length === 0 && !isLoadingLeads && !leadsError ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-600">
                No leads yet. Create one to see it here.
              </div>
            ) : (
              !isLoadingLeads && !leadsError &&
              <div className="grid gap-4 lg:grid-cols-2">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-[2px] hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
                      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-blue-100 blur-3xl" />
                      <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-indigo-100 blur-3xl" />
                    </div>
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xl font-semibold text-slate-900">
                          {lead.companyName}
                        </p>
                        <p className="text-sm text-slate-600">
                          {lead.contactPerson} | {lead.phone || "No phone"}
                        </p>
                      </div>
                      <span
                        className={`relative rounded-full px-3 py-1 text-xs font-semibold ${
                          lead.priority === "Hot"
                            ? "bg-gradient-to-r from-rose-100 to-rose-200 text-rose-700 shadow-inner shadow-rose-100"
                            : lead.priority === "Warm"
                              ? "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 shadow-inner shadow-amber-100"
                              : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 shadow-inner shadow-slate-100"
                        }`}
                      >
                        {lead.priority}
                      </span>
                    </div>
                    <div className="relative mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                      <InfoPill label="Source" value={lead.source || "-"} />
                      <InfoPill label="Model" value={lead.model || "-"} />
                      <InfoPill label="Purpose" value={lead.purpose || "-"} />
                      <InfoPill label="Expected qty" value={lead.expectedQty || "-"} />
                      <InfoPill label="State" value={lead.state || "-"} />
                      <InfoPill label="City" value={lead.city || "-"} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-600">
            {activeTab === "dashboard" ? "Dashboard content coming soon." : "Reports coming soon."}
          </div>
        )}
      </main>
    </div>
  );
}

function LeadOptionCard({
  title,
  description,
  icon,
  tone,
  onSelect,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  tone: "blue" | "emerald";
  onSelect?: () => void;
}) {
  const bg = tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700";
  const shadow =
    tone === "blue"
      ? "shadow-[0_18px_50px_rgba(59,130,246,0.12)]"
      : "shadow-[0_18px_50px_rgba(16,185,129,0.12)]";
  return (
    <button
      onClick={onSelect}
      className={`group flex h-full flex-col gap-3 rounded-[28px] border border-slate-100 bg-white/90 p-5 text-left shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition-all duration-200 ease-out hover:-translate-y-1 hover:border-slate-200 hover:bg-white hover:shadow-[0_20px_70px_rgba(15,23,42,0.12)] focus:outline-none`}
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} shadow-inner shadow-white transition ${shadow}`}>
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-blue-600 opacity-0 transition group-hover:opacity-100">
        Continue
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="m10 7 5 5-5 5" />
        </svg>
      </span>
    </button>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2 shadow-inner shadow-slate-100/70">
      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
