"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getRoleFromEmail } from "@/lib/role-map";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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

type DashboardLead = {
  company: string;
  id: string;
  status: "won" | "assigned" | "installed" | "quotation_sent" | "validated";
  region: string;
  date: string;
  temperature: "Hot" | "Warm";
};

function SalesCoordinatorAddLeadPageContent() {
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
  const handleTabChange = useCallback(
    (tab: "dashboard" | "new-lead" | "my-leads" | "reports") => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

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
    if (
      tabParam === "dashboard" ||
      tabParam === "new-lead" ||
      tabParam === "my-leads" ||
      tabParam === "reports"
    ) {
      setActiveTab(tabParam);
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
                  onClick={() => handleTabChange(tab.key as typeof activeTab)}
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
        ) : activeTab === "dashboard" ? (
          <DashboardTab
            addLeadBasePath={addLeadBasePath}
            router={router}
            roleSlug={roleSlug}
          />
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-600">
            Reports coming soon.
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

function DashboardTab({
  addLeadBasePath,
  router,
  roleSlug,
}: {
  addLeadBasePath: string;
  router: ReturnType<typeof useRouter>;
  roleSlug: string | null;
}) {
  const [view, setView] = useState<"overview" | "client360">("overview");
  const [priorityFilter, setPriorityFilter] = useState<"All" | "Hot" | "Warm" | "Cold" | "Emergency">("All");
  const [chartProgress, setChartProgress] = useState(0);

  const stats = {
    totalLeads: 10,
    validated: 1,
    pending: 0,
    assigned: 4,
    validationRate: 10,
    assignmentRate: 40,
    pendingReview: 0,
    totalPipeline: 10,
  };

  const recentLeads: DashboardLead[] = [
    { company: "NS", id: "251201", status: "won", region: "Tamil Nadu", date: "12/2/2025", temperature: "Warm" },
    { company: "Matrix Smart", id: "251111", status: "assigned", region: "Tamil Nadu", date: "11/22/2025", temperature: "Hot" },
    { company: "ABC COMPANY", id: "251110", status: "assigned", region: "Tamil Nadu", date: "11/18/2025", temperature: "Hot" },
    { company: "Ayesha Cody", id: "251109", status: "installed", region: "Tamilnadu", date: "11/17/2025", temperature: "Warm" },
    { company: "Qube", id: "251108", status: "won", region: "Tamilnadu", date: "11/15/2025", temperature: "Warm" },
    { company: "Matrix", id: "251107", status: "quotation_sent", region: "Tamilnadu", date: "11/15/2025", temperature: "Hot" },
    { company: "Yodas", id: "251106", status: "won", region: "Tamilnadu", date: "11/14/2025", temperature: "Hot" },
    { company: "NS", id: "251105", status: "assigned", region: "Tamilnadu", date: "11/14/2025", temperature: "Warm" },
    { company: "NS", id: "251104", status: "assigned", region: "Tamilnadu", date: "11/13/2025", temperature: "Hot" },
    { company: "NS", id: "bcb60b25", status: "validated", region: "Tamilnadu", date: "11/13/2025", temperature: "Warm" },
  ];

  const client360Leads = [
    {
      company: "Matrix Smart",
      id: "251111",
      contact: "Ravi Kumar",
      region: "Tamil Nadu",
      stage: "In Discussion",
      temperature: "Hot",
      priority: "Hot",
      owner: "Muthu",
      nextAction: "Demo on 12/05",
      value: "₹12.5L",
    },
    {
      company: "NS",
      id: "251201",
      contact: "Anita Joseph",
      region: "Tamil Nadu",
      stage: "Won",
      temperature: "Warm",
      priority: "Warm",
      owner: "Muthu",
      nextAction: "Handover pack",
      value: "₹8.2L",
    },
    {
      company: "Qube",
      id: "251108",
      contact: "John Peter",
      region: "Tamilnadu",
      stage: "Won",
      temperature: "Hot",
      priority: "Hot",
      owner: "Sai",
      nextAction: "Installation review",
      value: "₹10.0L",
    },
    {
      company: "ABC COMPANY",
      id: "251110",
      contact: "Karthik",
      region: "Tamil Nadu",
      stage: "Assigned",
      temperature: "Hot",
      priority: "Emergency",
      owner: "Muthu",
      nextAction: "Send quotation today",
      value: "₹6.3L",
    },
    {
      company: "Ayesha Cody",
      id: "251109",
      contact: "Ayesha",
      region: "Tamilnadu",
      stage: "Installed",
      temperature: "Warm",
      priority: "Warm",
      owner: "Anand",
      nextAction: "Post-install QA",
      value: "₹5.1L",
    },
    {
      company: "Matrix",
      id: "251107",
      contact: "Ramesh",
      region: "Tamilnadu",
      stage: "Quotation Sent",
      temperature: "Hot",
      priority: "Cold",
      owner: "Muthu",
      nextAction: "Follow-up Monday",
      value: "₹4.8L",
    },
    {
      company: "Yodas",
      id: "251106",
      contact: "Priya",
      region: "Tamilnadu",
      stage: "Won",
      temperature: "Hot",
      priority: "Hot",
      owner: "Raj",
      nextAction: "Kick-off call",
      value: "₹7.4L",
    },
    {
      company: "NS",
      id: "251105",
      contact: "Kiran",
      region: "Tamilnadu",
      stage: "Assigned",
      temperature: "Warm",
      priority: "Cold",
      owner: "Muthu",
      nextAction: "Collect specs",
      value: "₹3.9L",
    },
  ];

  const navigationCards = [
    {
      key: "new-lead",
      title: "New Lead",
      subtitle: "Start a lead flow",
      action: () => router.push(`${addLeadBasePath}/new`),
      tone: "blue",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      ),
    },
    {
      key: "client-360",
      title: "Client 360",
      subtitle: "Full profile view",
      action: () => setView("client360"),
      tone: "violet",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 12a4 4 0 1 0-4-4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4" />
          <path d="M17.5 15.5 20 18l-2.5 2.5" />
        </svg>
      ),
    },
    {
      key: "reports",
      title: "Reports",
      subtitle: "Export snapshots",
      action: () => router.push(`/dashboard/${roleSlug || "sales-co-ordinator"}/add-lead?tab=reports`),
      tone: "amber",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 4h16v16H4z" />
          <path d="M8 12h8" />
          <path d="M8 8h4" />
          <path d="M8 16h6" />
        </svg>
      ),
    },
  ];

  const legend = [
    { label: "Assigned", value: stats.assigned, color: "#38bdf8" },
    { label: "Validated", value: stats.validated, color: "#34d399" },
  ];

  const statusBreakdown = [
    { label: "Validated", count: stats.validated, percentage: `${stats.validationRate}%` },
    { label: "Assigned", count: stats.assigned, percentage: `${stats.assignmentRate}%` },
    { label: "Total Pipeline", count: stats.totalPipeline, percentage: "" },
  ];

  const quickInsights = [
    { label: "Validation Rate", value: "10%", accent: "text-emerald-600" },
    { label: "Assignment Rate", value: "40%", accent: "text-blue-600" },
    { label: "Pending Review", value: "0", accent: "text-amber-600" },
  ];

  const handleExport = () => {
    const headers = ["Company", "ID", "Status", "Region", "Date", "Temperature"];
    const rows = recentLeads.map((lead) => [lead.company, lead.id, lead.status, lead.region, lead.date, lead.temperature]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const safe = String(value).replace(/"/g, '""');
            return `"${safe}"`;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-coordinator-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleViewLead = (leadId: string) => {
    router.push(`/coordinator/lead/${leadId}`);
  };

  const statusColor = (status: DashboardLead["status"]) => {
    switch (status) {
      case "won":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "assigned":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "installed":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "quotation_sent":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "validated":
        return "bg-green-50 text-green-700 border-green-100";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const tempColor = (temp: DashboardLead["temperature"]) => {
    if (temp === "Hot") return "bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 border-rose-100";
    if (temp === "Warm") return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-100";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const priorityColor = (priority: string) => {
    if (priority === "Emergency") return "bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-[0_12px_30px_rgba(244,63,94,0.35)]";
    if (priority === "Hot") return "bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border border-red-100";
    if (priority === "Warm") return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-100";
    return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-200";
  };

  const priorityFilterTone = (priority: string, active: boolean) => {
    if (!active) return "border border-slate-200 bg-white text-slate-700";
    if (priority === "Emergency") return "bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-[0_12px_30px_rgba(244,63,94,0.35)]";
    if (priority === "Hot") return "bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border border-red-100 shadow-sm";
    if (priority === "Warm") return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-100 shadow-sm";
    if (priority === "Cold") return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-200 shadow-sm";
    return "bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.35)]";
  };

  const totalLegend = legend.reduce((sum, item) => sum + item.value, 0) || 1;

  useEffect(() => {
    if (view !== "overview") return;
    let raf: number;
    const duration = 900;
    const start = performance.now();
    setChartProgress(0);
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      setChartProgress(progress);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [view]);

  const buildGradientStops = () => {
    const maxValue = chartProgress * totalLegend;
    let consumed = 0;
    const stops: string[] = [];
    legend.forEach((item) => {
      if (consumed >= maxValue) {
        consumed += item.value;
        return;
      }
      const startDeg = (consumed / totalLegend) * 360;
      const usable = Math.min(item.value, Math.max(0, maxValue - consumed));
      const endDeg = ((consumed + usable) / totalLegend) * 360;
      if (usable > 0) {
        stops.push(`${item.color} ${startDeg}deg ${endDeg}deg`);
      }
      consumed += item.value;
    });
    const coveredDeg = Math.min(360, (maxValue / totalLegend) * 360);
    if (coveredDeg < 360) {
      stops.push(`#e5e7eb ${coveredDeg}deg 360deg`);
    }
    if (!stops.length) {
      stops.push("#e5e7eb 0deg 360deg");
    }
    return stops.join(", ");
  };

  const renderNavigation = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {navigationCards.map((card) => {
        const toneMap: Record<string, string> = {
          sky: "from-[#d8eaff] via-[#e5f2ff] to-[#d1e4ff] text-blue-800",
          blue: "from-[#d6e6ff] via-[#e0ecff] to-[#cedfff] text-blue-800",
          violet: "from-[#ebdcff] via-[#f1e6ff] to-[#e4d3ff] text-purple-800",
          amber: "from-[#ffe6bf] via-[#ffedcf] to-[#ffdeac] text-amber-800",
        };
        return (
          <button
            key={card.key}
            onClick={card.action}
            className={`group flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-gradient-to-br ${toneMap[card.tone]} p-4 text-left shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-current shadow-inner shadow-white/60">
              {card.icon}
            </span>
            <div className="mt-3">
              <p className="text-sm font-semibold text-slate-700">{card.subtitle}</p>
              <p className="text-lg font-semibold text-slate-900">{card.title}</p>
            </div>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 opacity-0 transition group-hover:opacity-100">
              Go to {card.title}
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="m10 7 5 5-5 5" />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderOverview = () => (
    <>
      {renderNavigation()}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Leads", value: stats.totalLeads, accent: "from-[#cfe5ff] via-[#d9ebff] to-[#c2ddff]" },
          { label: "Validated", value: stats.validated, accent: "from-[#c9f7e3] via-[#d2f9ea] to-[#b9f1d8]" },
          { label: "Pending", value: stats.pending, accent: "from-[#ffe3b8] via-[#ffe8c4] to-[#ffdba2]" },
          { label: "Assigned", value: stats.assigned, accent: "from-[#d3e6ff] via-[#dcedff] to-[#c6ddff]" },
        ].map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`} />
            <div className="relative">
              <p className="text-sm font-semibold text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.9fr]">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-100/50 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-36 w-36 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex-1">
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-400">Lead Status Overview</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Visual breakdown of your lead pipeline</h3>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {legend.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-inner shadow-slate-100">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label} ({item.value})
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="relative h-52 w-52">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: `conic-gradient(${buildGradientStops()})`,
                    transition: "background 0.3s ease-out",
                  }}
                />
                <div className="absolute inset-6 rounded-full bg-white shadow-inner shadow-slate-100" />
                <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full bg-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total</p>
                  <p className="text-3xl font-semibold text-slate-900">{stats.totalLeads}</p>
                  <p className="text-[11px] font-semibold text-slate-500">Pipeline</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">Status Breakdown</p>
                <h4 className="text-lg font-semibold text-slate-900">How your leads are distributed</h4>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-inner shadow-blue-100">
                Updated live
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {statusBreakdown.map((item, idx) => {
                const tones = [
                  "from-[#d8f8e6] via-[#c9f4dd] to-[#b9edcf] text-emerald-900 border-emerald-100/70 shadow-[0_12px_30px_rgba(16,185,129,0.12)]",
                  "from-[#d9e9ff] via-[#cfe4ff] to-[#c1dbff] text-blue-900 border-blue-100/70 shadow-[0_12px_30px_rgba(59,130,246,0.12)]",
                  "from-[#efe3ff] via-[#e7dbff] to-[#dccfff] text-purple-900 border-purple-100/70 shadow-[0_12px_30px_rgba(139,92,246,0.12)]",
                ];
                const tone = tones[idx % tones.length];
                return (
                  <div
                    key={item.label}
                    className={`rounded-2xl border bg-gradient-to-br px-4 py-3 ${tone}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{item.count}</p>
                    {item.percentage && <p className="text-sm font-semibold opacity-90">{item.percentage}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">Quick Insights</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {quickInsights.map((insight) => (
                <div key={insight.label} className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white px-4 py-3 shadow-inner shadow-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{insight.label}</p>
                  <p className={`mt-2 text-xl font-semibold ${insight.accent}`}>{insight.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">Recent Leads</p>
            <h4 className="text-xl font-semibold text-slate-900">Validation queue and recent activity</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push(`${addLeadBasePath}/new`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(59,130,246,0.35)] transition hover:-translate-y-[1px]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              New Lead
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-[1px]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M8 9l4-4 4 4" />
                <path d="M5 19h14" />
              </svg>
              Export to Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                <th className="px-6 py-3">Company</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Temperature</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">{lead.company}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">#{lead.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{lead.id}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusColor(lead.status)}`}>
                      {lead.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{lead.region}</td>
                  <td className="px-4 py-4 text-slate-700">{lead.date}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tempColor(lead.temperature)}`}>
                      {lead.temperature}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => handleViewLead(lead.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-[0_12px_25px_rgba(15,23,42,0.35)] transition hover:-translate-y-[1px]"
                    >
                      View
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="m10 7 5 5-5 5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const filteredClient360 = client360Leads.filter((lead) =>
    priorityFilter === "All" ? true : lead.priority === priorityFilter,
  );

  const renderClient360 = () => (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">Client 360</p>
          <h3 className="text-2xl font-semibold text-slate-900">All leads with priority & owners</h3>
          <p className="text-sm text-slate-600">Hot, Warm, Cold, and Emergency clearly marked with smooth transitions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView("overview")}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-[1px]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="m14 7-5 5 5 5" />
            </svg>
            Back to Overview
          </button>
          <button
            onClick={() => router.push(`${addLeadBasePath}/new`)}
            className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.35)] transition hover:-translate-y-[1px]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Add Lead
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", "Hot", "Warm", "Cold", "Emergency"].map((priority) => {
          const active = priorityFilter === priority;
          return (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority as typeof priorityFilter)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${priorityFilterTone(priority, active)}`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: active ? "rgba(255,255,255,0.9)" : undefined }}
              />
              {priority}
            </button>
          );
        })}
      </div>

      <div className="rounded-[30px] border border-slate-100 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Lead ID</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Next Action</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredClient360.map((lead) => (
                <tr key={lead.id} className="transition hover:-translate-y-[1px] hover:bg-gradient-to-r hover:from-slate-50 hover:to-indigo-50/40">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">{lead.company}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">#{lead.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{lead.id}</td>
                  <td className="px-4 py-4 text-slate-700">{lead.contact}</td>
                  <td className="px-4 py-4 text-slate-700">{lead.region}</td>
                  <td className="px-4 py-4 text-slate-700">{lead.stage}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition ${priorityColor(lead.priority)}`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{lead.owner}</td>
                  <td className="px-4 py-4 text-slate-700">{lead.nextAction}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{lead.value}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleViewLead(lead.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-[0_12px_25px_rgba(15,23,42,0.35)] transition hover:-translate-y-[1px]"
                      >
                        View
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="m10 7 5 5-5 5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => router.push(`${addLeadBasePath}/new`)}
                        className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 shadow-sm transition hover:-translate-y-[1px]"
                      >
                        Update
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M5 12h14" />
                          <path d="M12 5v14" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return <div className="mt-6 space-y-6">{view === "overview" ? renderOverview() : renderClient360()}</div>;
}

export default function SalesCoordinatorAddLeadPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-600">Loading lead workspace...</div>}>
      <SalesCoordinatorAddLeadPageContent />
    </Suspense>
  );
}
