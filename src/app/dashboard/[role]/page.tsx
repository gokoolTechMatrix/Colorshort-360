"use client";

import { DashboardSidebar, SidebarLink } from "@/components/dashboard/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getRoleFromEmail } from "@/lib/role-map";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement, ReactNode } from "react";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ??
  "admin@qube.com";

const slugifyRole = (role?: string | null) =>
  role?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ??
  "";

type DashboardProps = { profileName: string; roleSlug?: string };
type DashboardConfig = {
  title: string;
  Component: (props: DashboardProps & { activeTab?: string; onTabChange?: (tab: string) => void }) => ReactElement;
};
type SalesManagerTab =
  | "overview"
  | "approvals"
  | "orders"
  | "leads"
  | "executives"
  | "reports";
type SalesTabIcon = "layout" | "check" | "doc" | "stack" | "user" | "chart";
type PastelTone = "indigo" | "sky" | "emerald" | "amber" | "violet" | "rose";

const salesManagerTabs: { id: SalesManagerTab; label: string; icon: SalesTabIcon }[] = [
  { id: "overview", label: "Dashboard overview", icon: "layout" },
  { id: "approvals", label: "Approvals", icon: "check" },
  { id: "orders", label: "Order Sheets", icon: "doc" },
  { id: "leads", label: "Leads", icon: "stack" },
  { id: "executives", label: "Executives", icon: "user" },
  { id: "reports", label: "Reports & exports", icon: "chart" },
];

const renderSalesTabIcon = (icon: SalesTabIcon): ReactElement => {
  switch (icon) {
    case "layout":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m5 12 2 2 4-4" />
          <path d="M5 5h6M5 19h6" />
          <path d="M13 5h6M13 19h6" />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 4h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          <path d="M13 4v5h5" />
        </svg>
      );
    case "stack":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m12 3 9.5 5.5L12 14 2.5 8.5 12 3z" />
          <path d="m2.5 15.5 9.5 5.5 9.5-5.5" />
          <path d="m2.5 12 9.5 5.5 9.5-5.5" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="7" r="4" />
          <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 19h16" />
          <path d="m5 17 4-6 4 3 4-8" />
          <path d="M16 6h4v4" />
        </svg>
      );
  }
};

const pastelToneStyles: Record<PastelTone, { card: string; badge: string; shadow: string }> = {
  indigo: {
    card: "from-indigo-100 via-white to-indigo-200/90 border-indigo-200",
    badge: "bg-indigo-200 text-indigo-800",
    shadow: "shadow-[0_14px_36px_rgba(99,102,241,0.16)]",
  },
  sky: {
    card: "from-sky-100 via-white to-sky-200/90 border-sky-200",
    badge: "bg-sky-200 text-sky-800",
    shadow: "shadow-[0_14px_36px_rgba(14,165,233,0.16)]",
  },
  emerald: {
    card: "from-emerald-100 via-white to-emerald-200/90 border-emerald-200",
    badge: "bg-emerald-200 text-emerald-800",
    shadow: "shadow-[0_14px_36px_rgba(16,185,129,0.18)]",
  },
  amber: {
    card: "from-amber-100 via-white to-amber-200/90 border-amber-200",
    badge: "bg-amber-200 text-amber-800",
    shadow: "shadow-[0_14px_36px_rgba(251,191,36,0.18)]",
  },
  violet: {
    card: "from-violet-100 via-white to-violet-200/90 border-violet-200",
    badge: "bg-violet-200 text-violet-800",
    shadow: "shadow-[0_14px_36px_rgba(139,92,246,0.16)]",
  },
  rose: {
    card: "from-rose-100 via-white to-rose-200/90 border-rose-200",
    badge: "bg-rose-200 text-rose-800",
    shadow: "shadow-[0_14px_36px_rgba(244,63,94,0.14)]",
  },
};

const dashboards: Record<string, DashboardConfig> = {
  "store-incharge": {
    title: "Store Incharge Dashboard",
    Component: StoreInchargeDashboard,
  },
  "zonal-manager": {
    title: "Zonal Manager Dashboard",
    Component: ZonalManagerDashboard,
  },
  "purchase-manager": {
    title: "Purchase Manager Dashboard",
    Component: PurchaseManagerDashboard,
  },
  "service-co-ordinator": {
    title: "Service Co-ordinator Dashboard",
    Component: ServiceCoordinatorDashboard,
  },
  hr: {
    title: "HR Dashboard",
    Component: HrDashboard,
  },
  "sales-manager": {
    title: "Sales Manager Dashboard",
    Component: SalesManagerDashboard,
  },
  "sales-co-ordinator": {
    title: "Sales Co-ordinator Dashboard",
    Component: SalesCoordinatorDashboard,
  },
  accountant: {
    title: "Accountant Dashboard",
    Component: AccountantDashboard,
  },
  "service-engineer": {
    title: "Service Engineer Dashboard",
    Component: ServiceEngineerDashboard,
  },
  "sales-executive": {
    title: "Sales Executive Dashboard",
    Component: SalesExecutiveDashboard,
  },
  "service-manager": {
    title: "Service Manager Dashboard",
    Component: ServiceManagerDashboard,
  },
};

export default function RoleDashboardPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const params = useParams<{ role: string }>();
  const requestedSlug = Array.isArray(params.role) ? params.role[0] : params.role;

  const [profileName, setProfileName] = useState("Team Member");
  const [roleSlug, setRoleSlug] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [salesActiveTab, setSalesActiveTab] = useState<SalesManagerTab>("overview");
  const leadNavRoles = new Set([
    "super_admin",
    "admin",
    "hr",
    "finance",
    "accountant",
    "sales-manager",
    "sales-co-ordinator",
    "sales-executive",
    "service-manager",
    "service-co-ordinator",
    "service-executive",
    "service-engineer",
    "zonal-manager",
  ]);

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
      const computedSlug = slugifyRole(fetchedRole);
      const isSuperAdmin =
        user.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
        computedSlug === "super_admin";

      setRoleSlug(computedSlug);
      const derivedName =
        (user.user_metadata?.full_name as string | undefined) ?? "Team Member";
      setProfileName(derivedName);

      if (isSuperAdmin) {
        router.replace("/dashboard/admin");
        return;
      }

      if (!computedSlug) {
        setIsChecking(false);
        return;
      }

      if (requestedSlug !== computedSlug) {
        router.replace(`/dashboard/${computedSlug}`);
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
  }, [requestedSlug, router, supabase]);

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
    if (roleSlug !== "sales-manager") return;
    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      const matchingTab = salesManagerTabs.find((tab) => tab.id === hash);
      if (matchingTab) {
        setSalesActiveTab(matchingTab.id);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [roleSlug]);

  useEffect(() => {
    if (roleSlug !== "sales-manager") return;
    const targetHash = `#${salesActiveTab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, "", targetHash);
    }
  }, [roleSlug, salesActiveTab]);

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
        Loading dashboard…
      </div>
    );
  }

  if (!roleSlug) {
    return (
      <RestrictedView
        message="No dashboard configured for this account."
        onLogout={handleLogout}
      />
    );
  }

  const config = dashboards[roleSlug];

  if (!config) {
    return (
      <RestrictedView
        message="This dashboard is not available for your role."
        onLogout={handleLogout}
      />
    );
  }

  const { Component, title } = config;
  const isSalesManager = roleSlug === "sales-manager";
  const salesNavLinks = isSalesManager
    ? salesManagerTabs.map((tab) => ({
        label: tab.label,
        href: `#${tab.id}`,
        icon: renderSalesTabIcon(tab.icon),
      }))
    : undefined;
  const handleSalesNavClick = (href: string) => {
    if (!href.startsWith("#")) return;
    const matchingTab = salesManagerTabs.find((tab) => `#${tab.id}` === href);
    if (matchingTab) {
      setSalesActiveTab(matchingTab.id);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-50">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        companyLogo={companyLogo}
        onLogout={handleLogout}
        isSigningOut={isSigningOut}
        activeHref={isSalesManager ? `#${salesActiveTab}` : "/dashboard"}
        linksOverride={salesNavLinks}
        onLinkClick={isSalesManager ? handleSalesNavClick : undefined}
        showLeadManagement={!isSalesManager && leadNavRoles.has(roleSlug ?? "")}
      />

      <main className="flex-1 px-6 py-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">
            Secure workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
        </header>
        <Component
          profileName={profileName}
          roleSlug={roleSlug}
          {...(isSalesManager
            ? {
                activeTab: salesActiveTab,
                onTabChange: (tab: string) => setSalesActiveTab(tab as SalesManagerTab),
              }
            : {})}
        />
      </main>
    </div>
  );
}

function RestrictedView({
  message,
  onLogout,
}: {
  message: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.4em] text-rose-400">
          Restricted
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Access denied
        </h1>
        <p className="mt-4 text-sm text-slate-600">{message}</p>
        <button
          onClick={onLogout}
          className="mt-8 w-full rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Return to login
        </button>
      </div>
    </div>
  );
}

function KpiGrid({
  items,
  palette,
}: {
  items: Array<{ label: string; value: string; subLabel?: string }>;
  palette?: string[];
}) {
  const gradients =
    palette ??
    [
      "bg-[#e8f0ff]",
      "bg-[#ffe9ee]",
      "bg-[#fff4d9]",
      "bg-[#e9fff2]",
    ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
      className={`group rounded-3xl border border-white/60 bg-gradient-to-br ${gradients[index % gradients.length]} p-5 shadow-lg shadow-slate-100 transition hover:-translate-y-1 hover:shadow-xl`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
        {item.label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">
        {item.value}
      </p>
      {item.subLabel && (
        <p className="mt-1 text-sm font-semibold text-slate-700">
          {item.subLabel}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  variant = "plain",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: "plain" | "pastel";
}) {
  const baseClasses =
    "rounded-[32px] border border-slate-100 bg-white/90 p-6 shadow-[0_25px_85px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_30px_110px_rgba(15,23,42,0.12)]";
  const pastelClasses =
    "rounded-[32px] border border-indigo-50 bg-gradient-to-br from-white via-indigo-50/60 to-white p-6 shadow-[0_25px_85px_rgba(99,102,241,0.12)] transition hover:-translate-y-1 hover:shadow-[0_30px_120px_rgba(99,102,241,0.16)]";

  return (
    <section className={variant === "pastel" ? pastelClasses : baseClasses}>
      <div className="mb-4 space-y-1">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {subtitle && (
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm text-slate-600">
      {items.map((item, index) => (
        <li
          key={index}
          className="rounded-2xl border border-white/70 bg-gradient-to-r from-slate-50 to-white px-4 py-3 shadow-sm shadow-slate-100"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function QuickActions({ actions }: { actions: string[] }) {
  const actionPalette = [
    "from-indigo-200 to-indigo-400 text-indigo-900",
    "from-rose-200 to-rose-400 text-rose-900",
    "from-amber-200 to-amber-400 text-amber-900",
    "from-emerald-200 to-emerald-400 text-emerald-900",
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((action, index) => (
        <button
          key={action}
          className={`rounded-2xl bg-gradient-to-r ${actionPalette[index % actionPalette.length]} px-4 py-3 text-sm font-semibold shadow-md shadow-slate-200 transition hover:-translate-y-[2px] hover:shadow-lg`}
        >
          {action}
        </button>
      ))}
    </div>
  );
}

function ZonalManagerDashboard({ profileName }: DashboardProps) {
  const kpis = [
    { label: "Total Leads in Zone", value: "1,280", subLabel: "+5.3% vs last week" },
    { label: "New Leads This Week", value: "112", subLabel: "+18 new leads since yesterday" },
    { label: "Pending Approvals", value: "34", subLabel: "Quotation approvals pending" },
    { label: "Hot Leads", value: "76", subLabel: "Actively moving leads" },
  ];

  const zoneSnapshot = [
    { label: "Leads Assigned Today", value: "54", delta: "+14 vs yesterday" },
    { label: "Follow-ups Due Today", value: "89", delta: "-12 vs yesterday" },
    { label: "Conversions Today", value: "7", delta: "+2 since yesterday" },
    { label: "Escalations Raised", value: "2", delta: "Zone-wide issues" },
  ];

  const aging = [
    { label: "0-7 days", value: "420 Leads", percent: 72, tone: "emerald" },
    { label: "8-15 days", value: "240 Leads", percent: 56, tone: "sky" },
    { label: "16-30 days", value: "140 Leads", percent: 38, tone: "amber" },
    { label: "30+ days", value: "80 Leads", percent: 22, tone: "rose" },
  ];

  const executives = [
    { name: "Ananya (South)", closed: "78 Leads Closed", fill: 82, tone: "emerald" },
    { name: "Rohan (West)", closed: "62 Leads Closed", fill: 68, tone: "sky" },
    { name: "Meera (North)", closed: "38 Leads Closed", fill: 46, tone: "amber" },
    { name: "Arjun (East)", closed: "24 Leads Closed", fill: 34, tone: "indigo" },
  ];

  const followUps = [
    { label: "Pending Follow-ups", value: "182", tone: "indigo" },
    { label: "High Priority (Today)", value: "36", tone: "amber" },
    { label: "Overdue Follow-ups", value: "54", tone: "rose" },
    { label: "Completed Today", value: "89", tone: "emerald" },
  ];

  const pendingTasks = [
    "Approve 14 quotations from executives",
    "Reassign leads for inactive executives",
    "Review escalated customer complaints",
    "Validate special commodity leads",
    "Audit overdue follow-ups",
  ];

  const quickActions = ["+ New Lead", "Reassign Leads", "View Special Leads", "Export Zone Report"];

  const toneMap: Record<string, string> = {
    emerald: "from-emerald-400 to-emerald-600",
    sky: "from-sky-400 to-blue-500",
    amber: "from-amber-400 to-amber-500",
    rose: "from-rose-400 to-rose-500",
    indigo: "from-indigo-400 to-indigo-600",
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1da1f2] via-[#0fd1c5] to-[#14dfbd] p-6 text-white shadow-[0_28px_90px_rgba(13,161,242,0.32)]">
        <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-6 bottom-6 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-4 h-24 w-24 rounded-full bg-white/15 blur-2xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-white/80">
              Zonal Manager Dashboard
            </p>
            <h2 className="text-3xl font-semibold">
              Hello {profileName}, your zone performance at a glance.
            </h2>
            <p className="max-w-2xl text-sm text-white/80">
              Track approvals, freshness of the funnel, and executive throughput across your region.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">South & West zones</span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">Live escalations: 2</span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">Hot leads: 76</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <button className="rounded-full border border-white/70 bg-white px-4 py-2 text-cyan-700 shadow-sm transition hover:-translate-y-[1px] hover:shadow-lg">
              + Assign Leads
            </button>
            <button className="rounded-full border border-white/70 px-4 py-2 text-white transition hover:bg-white/15">
              View Approvals
            </button>
            <button className="rounded-full border border-white/70 px-4 py-2 text-white transition hover:bg-white/15">
              Export Zone Report
            </button>
          </div>
        </div>
      </div>

      <KpiGrid
        palette={[
          "from-[#b6dcff] via-[#8ec2ff] to-[#5aa5ff]",
          "from-[#ffd3e4] via-[#ff9fc7] to-[#ff74ac]",
          "from-[#ffe7b8] via-[#ffd17a] to-[#ffb347]",
          "from-[#bff7e0] via-[#78e8c2] to-[#38dba5]",
        ]}
        items={kpis}
      />

      <Section title="Zone snapshot" subtitle="Today in your zone" variant="pastel">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {zoneSnapshot.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-indigo-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              <p className="text-xs font-semibold text-slate-500">{item.delta}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Lead aging" subtitle="Pipeline freshness by bucket">
        <div className="grid gap-3">
          {aging.map((bucket) => (
            <div
              key={bucket.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100"
            >
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>{bucket.label}</span>
                <span className="text-xs text-slate-500">{bucket.value}</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${toneMap[bucket.tone]}`}
                  style={{ width: `${bucket.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Executive performance" subtitle="Top executives and closures">
        <div className="space-y-3">
          {executives.map((exec) => (
            <div
              key={exec.name}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100"
            >
              <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span>{exec.name}</span>
                </div>
                <button className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200">
                  View
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">{exec.closed}</p>
              <div className="mt-3 h-3 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${toneMap[exec.tone]}`}
                  style={{ width: `${exec.fill}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Follow-up summary" subtitle="What needs attention today" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {followUps.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm shadow-indigo-100"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              <div
                className={`mt-2 h-1.5 rounded-full bg-gradient-to-r ${toneMap[item.tone]}`}
                style={{ width: "100%" }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pending tasks" subtitle="Action queue">
        <div className="grid gap-3 lg:grid-cols-2">
          {pendingTasks.map((task) => (
            <div
              key={task}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-100"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-indigo-600 shadow-inner">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <span>{task}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Action</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Quick actions" subtitle="Move faster" variant="pastel">
        <div className="rounded-3xl border border-cyan-100 bg-gradient-to-r from-[#e0f4ff] via-[#e0fff7] to-[#f3fff0] p-4 shadow-sm shadow-cyan-100">
          <QuickActions actions={quickActions} />
        </div>
      </Section>
    </div>
  );
}

function StoreInchargeDashboard({ profileName }: DashboardProps) {
  const kpis = [
    { label: "Total Stock Value", value: "Rs 12,40,000", subLabel: "+3.2% vs last week" },
    { label: "Low Stock Items", value: "8", subLabel: "3 critical" },
    { label: "Today GRNs", value: "3", subLabel: "2 pending QA" },
    { label: "Material Issues", value: "5", subLabel: "Service dept" },
  ];
  const buckets = [
    { label: "Raw Materials", value: "Rs 7,20,000", percent: 60 },
    { label: "Finished Goods", value: "Rs 4,10,000", percent: 34 },
    { label: "Others", value: "Rs 1,10,000", percent: 9 },
  ];
  const alerts = [
    "GRN received from Steel Traders (Rs 35,000)",
    "Issued bearings to Service Dept (WO-140)",
    "Received 20 lubrication cans from Vendor",
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Store incharge
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {profileName}, keep stock healthy and flowing.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Monitor valuations, inflow/outflow, and low stock in one glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              GRNs today: 3
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Issues: 5
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Low stock: 8
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            + Create GRN
          </button>
          <button className="rounded-2xl border border-white/60 bg-white/10 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/15">
            Issue material
          </button>
        </div>
      </div>

      <KpiGrid
        items={kpis}
        palette={[
          "bg-gradient-to-br from-[#7ab4ff] via-[#2f8cff] to-[#0067ff]",
          "bg-gradient-to-br from-[#ffa3cb] via-[#ff5b9b] to-[#ff2a7a]",
          "bg-gradient-to-br from-[#ffce70] via-[#ff9c2f] to-[#ff7600]",
          "bg-gradient-to-br from-[#96ffc9] via-[#3eea91] to-[#00c76a]",
        ]}
      />

      <Section subtitle={`Overview for ${profileName}`} title="Stock overview" variant="pastel">
        <div className="space-y-4 text-sm text-slate-600">
          {buckets.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600"
                  style={{ inlineSize: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's activities" variant="pastel">
        <List items={alerts} />
      </Section>

      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Create GRN",
            "+ Issue Material",
            "+ Add Stock",
            "+ Record Damage",
            "+ Export Inventory",
          ]}
        />
      </Section>
    </div>
  );
}

function PurchaseManagerDashboard({ profileName }: DashboardProps) {
  const spend = [
    { label: "Electrical", value: "₹ 1,60,000" },
    { label: "Mechanical", value: "₹ 1,10,000" },
    { label: "Consumables", value: "₹ 90,000" },
  ];
  const tasks = [
    "Approve PO-221 (Fasteners Ltd – ₹18,000)",
    "Create PO for Steel Rod (PR-112)",
    "Follow-up GRN from Lubricant Supplier",
    "Lock vendor shortlist for bearings",
  ];
  const actions = [
    "+ Create PO",
    "+ Add Vendor",
    "+ Review PR",
    "+ Price Comparison",
    "+ Request Quotes",
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Purchase control
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {profileName}, streamline POs and GRNs.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Track approvals, inbound GRNs, and vendor spend in one view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Open PRs: 12
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              POs pending: 4
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              GRNs pending: 3
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            + Create PO
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/15">
            Review PRs
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "Open PRs", value: "12", subLabel: "4 urgent" },
          { label: "POs Pending Approval", value: "4", subLabel: "Avg age 6h" },
          { label: "GRNs Pending", value: "3", subLabel: "2 need QA" },
          { label: "Monthly Purchase Value", value: "₹ 4,20,000", subLabel: "+6% vs last month" },
        ]}
      />

      <Section title="Purchase overview" subtitle={`Spend split for ${profileName}`} variant="pastel">
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
          {spend.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/70 bg-white/90 px-4 py-4 shadow-sm shadow-indigo-50 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's tasks" variant="pastel">
        <List items={tasks} />
      </Section>

      <Section title="Quick actions">
        <QuickActions actions={actions} />
      </Section>
    </div>
  );
}

function ServiceCoordinatorDashboard({ profileName }: DashboardProps) {
  const queue = [
    { ticket: "T-312", issue: "Belt slippage", site: "Chennai", age: "28m", priority: "High" },
    { ticket: "T-305", issue: "Sensor fault", site: "Coimbatore", age: "1h 12m", priority: "Medium" },
    { ticket: "T-299", issue: "Motor vibration", site: "Madurai", age: "2h 05m", priority: "High" },
    { ticket: "T-295", issue: "HMI restart", site: "Trichy", age: "3h 42m", priority: "Low" },
  ];
  const engineers = [
    { name: "Aravind", zone: "North", jobs: 3, eta: "18m", status: "Onsite" },
    { name: "Meena", zone: "Central", jobs: 2, eta: "32m", status: "Enroute" },
    { name: "Karthik", zone: "South", jobs: 4, eta: "54m", status: "On call" },
    { name: "Rahul", zone: "West", jobs: 1, eta: "08m", status: "Wrapping" },
  ];
  const sla = [
    { label: "First Response", value: 86 },
    { label: "Resolution", value: 72 },
    { label: "Follow-up", value: 91 },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/80">
              Service control
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Hi {profileName}, keep the tickets flowing.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Dispatch engineers faster, watch SLA health, and unblock high-priority calls.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              Live Tickets: 18
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              Field Engineers: 12
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              SLA: 92% on track
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          <button className="rounded-2xl bg-white px-4 py-2 text-sky-700 shadow-lg shadow-sky-200 transition hover:-translate-y-[1px] hover:shadow-xl">
            + Dispatch engineer
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:bg-white/15">
            View escalations
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "New Complaints Today", value: "12", subLabel: "+4 vs yesterday" },
          { label: "Jobs Assigned", value: "18", subLabel: "5 awaiting dispatch" },
          { label: "Pending Jobs", value: "7", subLabel: "3 overdue" },
          { label: "Completed Today", value: "9", subLabel: "Avg TTR 56m" },
        ]}
      />
      <Section
        title="Service pipeline"
        subtitle={`Pipeline health for ${profileName}`}
        variant="pastel"
      >
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { stage: "Logged", value: 22, color: "from-indigo-200 to-indigo-400" },
            { stage: "Assigned", value: 18, color: "from-sky-200 to-sky-400" },
            { stage: "In Progress", value: 11, color: "from-amber-200 to-amber-400" },
            { stage: "Completed", value: 9, color: "from-emerald-200 to-emerald-400" },
          ].map((item) => (
            <div
              key={item.stage}
              className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-indigo-50 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-2xl font-semibold text-slate-900 shadow-inner shadow-white`}
              >
                {item.value}
              </div>
              <p className="mt-3 text-center text-xs uppercase tracking-[0.3em] text-slate-500">
                {item.stage}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Live queue">
        <div className="grid gap-3 lg:grid-cols-2">
          {queue.map((ticket) => (
            <div
              key={ticket.ticket}
              className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="absolute inset-0 opacity-70 blur-2xl" style={{ background: `radial-gradient(circle at 30% 20%, rgba(59,130,246,0.12), transparent 35%), radial-gradient(circle at 70% 0%, rgba(16,185,129,0.12), transparent 30%)` }} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    {ticket.ticket} · {ticket.site}
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {ticket.issue}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Age: {ticket.age}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    ticket.priority === "High"
                      ? "bg-rose-50 text-rose-600"
                      : ticket.priority === "Medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Engineer utilization" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {engineers.map((engineer) => (
            <div
              key={engineer.name}
              className="rounded-2xl border border-indigo-50 bg-white/90 p-4 text-sm shadow-md shadow-indigo-100 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">
                  {engineer.name}
                </p>
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                  {engineer.zone}
                </span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                Status: {engineer.status}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Jobs: {engineer.jobs}
                </p>
                <p className="text-xs font-semibold text-emerald-600">
                  ETA {engineer.eta}
                </p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-emerald-400"
                  style={{ width: `${Math.min(engineer.jobs * 18 + 30, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="SLA health">
        <div className="grid gap-4 sm:grid-cols-3">
          {sla.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {metric.label}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-slate-900">
                  {metric.value}%
                </p>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                  Target 90%
                </span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's priority tasks">
        <List
          items={[
            "Dispatch engineer for motor overheating (Kumar Industries)",
            "Follow-up with Aravind on T-298 and update ETA",
            "Schedule site visit for conveyor fault at Sri Plastics",
            "Call back T-305 and confirm spare readiness",
          ]}
        />
      </Section>
    </div>
  );
}

function SalesCoordinatorDashboard({ profileName }: DashboardProps) {
  const router = useRouter();
  const deals = [
    { name: "Sri Plastics", value: "₹ 4,80,000", stage: "Negotiation", eta: "Close in 5d", tone: "amber" },
    { name: "North Mills", value: "₹ 3,25,000", stage: "Quote sent", eta: "Follow-up tomorrow", tone: "sky" },
    { name: "Summit Agro", value: "₹ 2,10,000", stage: "Contacted", eta: "Demo scheduled", tone: "indigo" },
    { name: "Arora Foods", value: "₹ 1,45,000", stage: "Won", eta: "PO received", tone: "emerald" },
  ];
  const funnel = [
    { stage: "New", value: 12, gradient: "from-indigo-200 via-indigo-300 to-indigo-400" },
    { stage: "Contacted", value: 20, gradient: "from-sky-200 via-sky-300 to-sky-400" },
    { stage: "Quotation Sent", value: 8, gradient: "from-amber-200 via-amber-300 to-amber-400" },
    { stage: "Negotiation", value: 6, gradient: "from-purple-200 via-purple-300 to-purple-400" },
    { stage: "Closed", value: 4, gradient: "from-emerald-200 via-emerald-300 to-emerald-400" },
  ];
  const actions = ["+ Add Lead", "+ Create Quotation", "+ Assign Lead", "+ Send Follow-up", "+ Schedule Demo", "+ Send Catalog"];
  const tasks = [
    "Assign 3 new leads to sales team",
    "Prepare quotation for Sri Plastics",
    "Follow-up pending quotation Q-142",
    "Send product catalogue to Star Metals",
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Sales coordination
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {profileName}, keep the funnel moving.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Track leads, follow-ups, and conversion health at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Leads today: 12
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Quotes sent: 10
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Win rate: 24%
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm"
            onClick={() => router.push("/dashboard/sales-co-ordinator/add-lead")}
          >
            + Add lead
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/15">
            Schedule demo
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "New Leads Today", value: "12" },
          { label: "Quotations Pending", value: "8" },
          { label: "Follow-ups Today", value: "6" },
          { label: "Orders Closed", value: "4" },
        ]}
      />
      <Section title="Lead pipeline summary" subtitle={`Focus areas for ${profileName}`} variant="pastel">
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-5">
          {funnel.map((item) => (
            <div
              key={item.stage}
              className={`rounded-2xl border border-white/70 bg-gradient-to-br ${item.gradient} p-4 text-center text-slate-900 shadow-md shadow-indigo-100 transition hover:-translate-y-[2px] hover:shadow-xl`}
            >
              <div className="text-3xl font-semibold">{item.value}</div>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-800">
                {item.stage}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Top opportunities" subtitle="Focus deals to close" variant="pastel">
        <div className="grid gap-3 lg:grid-cols-2">
          {deals.map((deal) => (
            <div
              key={deal.name}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{deal.name}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {deal.stage}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    deal.tone === "amber"
                      ? "bg-amber-50 text-amber-700"
                      : deal.tone === "sky"
                        ? "bg-sky-50 text-sky-700"
                        : deal.tone === "emerald"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {deal.value}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-600">
                {deal.eta}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's task list">
        <List items={tasks} />
      </Section>

      <Section title="Quick actions">
        <QuickActions actions={actions} />
      </Section>
    </div>
  );
}

function SalesManagerDashboard({
  profileName,
  roleSlug,
  activeTab,
  onTabChange: _onTabChange,
}: DashboardProps & { activeTab?: string; onTabChange?: (tab: string) => void }) {
  void _onTabChange;
  const router = useRouter();
  const currentTab: SalesManagerTab =
    salesManagerTabs.find((tab) => tab.id === activeTab) ? (activeTab as SalesManagerTab) : "overview";
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState<"quote" | "order" | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [approvedDiscount, setApprovedDiscount] = useState("");
  const [approvedTenor, setApprovedTenor] = useState("");
  const [managerComments, setManagerComments] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [verifyNote, setVerifyNote] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoadingPage(false), 380);
    return () => {
      window.clearTimeout(timer);
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const triggerToast = (message: string, tone: "success" | "error" = "success") => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast({ message, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 2000);
  };

  const simulateNetwork = (duration = 650) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, duration);
    });

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    triggerToast(trimmed ? `Filtered by "${trimmed}"` : "Showing all results", "success");
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setDataRefreshKey((prev) => prev + 1);
    try {
      await simulateNetwork(520);
      triggerToast("Data refreshed", "success");
    } catch {
      triggerToast("Refresh failed. Rolled back.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const pipelineMetrics: { code: string; label: string; value: number; tone: PastelTone }[] = [
    { code: "N", label: "New", value: 0, tone: "violet" },
    { code: "V", label: "Validated", value: 2, tone: "sky" },
    { code: "W", label: "Working", value: 8, tone: "indigo" },
    { code: "Q", label: "Quotation Sent", value: 1, tone: "amber" },
    { code: "Q", label: "Quotation Approved", value: 0, tone: "emerald" },
    { code: "O", label: "Ordered", value: 0, tone: "rose" },
  ];

    const orderSheets = [
    {
      id: "ecabb808",
      lead: "Ayesha Cody",
      model: "CS-10000",
      qty: 1,
      total: "Rs 12,00,000",
      by: "Mani",
      on: "--",
      unitPrice: "Rs 12,00,000",
      discountValue: "Rs 0",
      paymentMethod: "EMI",
      deliveryTimeline: "2 weeks",
      shipmentType: "Standard",
      customerName: "Ayesha Cody",
      gstNumber: "--",
      billingAddress: "--",
      shippingAddress: "--",
      specialRequest: "--",
      termsNotes: "--",
      status: "submitted",
    },
    {
      id: "e8b382bc",
      lead: "Qube",
      model: "CS-10000",
      qty: 1,
      total: "Rs 11,70,007",
      by: "Mani",
      on: "11/17/2025, 3:39:24 PM",
      unitPrice: "Rs 11,70,007",
      discountValue: "Rs 0",
      paymentMethod: "EMI",
      deliveryTimeline: "1 week",
      shipmentType: "Road",
      customerName: "Qube",
      gstNumber: "29AAACQ1234A1Z5",
      billingAddress: "Bangalore, KA",
      shippingAddress: "Chennai, TN",
      specialRequest: "Priority install",
      termsNotes: "Standard warranty applies",
      status: "pending",
    },
    {
      id: "c584b850",
      lead: "Yodas",
      model: "CS-5000",
      qty: 1,
      total: "Rs 8,35,000",
      by: "Mani",
      on: "11/17/2025, 4:04:35 PM",
      unitPrice: "Rs 8,35,000",
      discountValue: "Rs 0",
      paymentMethod: "EMI",
      deliveryTimeline: "3 weeks",
      shipmentType: "Air",
      customerName: "Yodas",
      gstNumber: "27AAACY7890D1Z2",
      billingAddress: "Hyderabad, TS",
      shippingAddress: "Hyderabad, TS",
      specialRequest: "Install during off-hours",
      termsNotes: "Include operator training",
      status: "submitted",
    },
    {
      id: "035bf81f",
      lead: "Matrix Smart",
      model: "CS-10000",
      qty: 1,
      total: "Rs 11,80,000",
      by: "Mani",
      on: "11/22/2025, 1:06:54 PM",
      unitPrice: "Rs 11,80,000",
      discountValue: "Rs 0",
      paymentMethod: "EMI",
      deliveryTimeline: "10 days",
      shipmentType: "Road",
      customerName: "Matrix Smart",
      gstNumber: "33AAACM5555J1Z7",
      billingAddress: "Coimbatore, TN",
      shippingAddress: "Coimbatore, TN",
      specialRequest: "--",
      termsNotes: "Final confirmation needed",
      status: "submitted",
    },
  ];

const pendingApprovals = [
    {
      id: "Q-2025-666",
      lead: "ABC Company",
      model: "037e924c-02a5-4ea6-90df-471861a25e96",
      discount: "?",
      payment: "EMI",
      created: "11/21/2025, 1:00:17 PM",
      basePrice: "Rs 4,00,000",
      finalPrice: "Rs 0",
      requestedDiscount: "Rs 4,00,000",
      emiTenor: 3,
      validityDate: "2025-11-21",
      installationPayer: "Customer",
      leadPhone: "9042160564",
      leadSource: "Referral",
      leadPriority: "Hot",
    },
    {
      id: "e1b874ae-0175-4cbf-92a7-611e70a57b64",
      lead: "ABC Company",
      model: "037e924c-02a5-4ea6-90df-471861a25e96",
      discount: "?",
      payment: "EMI",
      created: "11/21/2025, 1:00:40 PM",
      basePrice: "Rs 3,96,000",
      finalPrice: "Rs 3,96,000",
      requestedDiscount: "Rs 4,000",
      emiTenor: 3,
      validityDate: "2025-11-21",
      installationPayer: "Customer",
      leadPhone: "9042160564",
      leadSource: "Referral",
      leadPriority: "Hot",
    },
    {
      id: "Q-2025-711",
      lead: "ABC Company",
      model: "037e924c-02a5-4ea6-90df-471861a25e96",
      discount: "?",
      payment: "EMI",
      created: "11/21/2025, 1:01:42 PM",
      basePrice: "Rs 3,98,000",
      finalPrice: "Rs 3,98,000",
      requestedDiscount: "Rs 2,000",
      emiTenor: 3,
      validityDate: "2025-11-21",
      installationPayer: "Customer",
      leadPhone: "9042160564",
      leadSource: "Referral",
      leadPriority: "Hot",
    },
  ];

const approvalsQueue = pendingApprovals.map((item) => ({
    ...item,
    requestedBy: "Mani",
    emi: 3,
  }));

  const recentlyApproved = [
    { id: "Q-2025-643", lead: "Matrix", model: "5560598b-27e4-47a0-b7bb-a7220c54b0ef", price: "Rs 11,70,000", requestedBy: "Mani", approvedOn: "11/15/2025, 12:22:21 PM" },
    { id: "c76db495-3a20-4481-85f8-6287aaa90179", lead: "NS", model: "037e924c-02a5-4ea6-90df-471861a25e96", price: "Rs 3,80,004", requestedBy: "Mani", approvedOn: "11/14/2025, 8:19:24 PM" },
    { id: "Q-2025-874", lead: "NS", model: "037e924c-02a5-4ea6-90df-471861a25e96", price: "Rs 3,80,004", requestedBy: "Mani", approvedOn: "11/14/2025, 8:19:19 PM" },
    { id: "Q-2025-181", lead: "NS", model: "037e924c-02a5-4ea6-90df-471861a25e96", price: "Rs 4,00,000", requestedBy: "Mani", approvedOn: "11/14/2025, 12:34:10 AM" },
    { id: "Q-2025-886", lead: "NS", model: "037e924c-02a5-4ea6-90df-471861a25e96", price: "Rs 3,90,000", requestedBy: "Mani", approvedOn: "11/14/2025, 12:26:38 AM" },
    { id: "Q-2025-969", lead: "NS", model: "037e924c-02a5-4ea6-90df-471861a25e96", price: "Rs 3,50,000", requestedBy: "Mani", approvedOn: "11/13/2025, 5:49:10 PM" },
  ];

  const executives = [
    { name: "Mani", leads: 11, quotes: 3, conversion: "18%", status: "Open" },
    { name: "Gokul", leads: 7, quotes: 2, conversion: "22%", status: "Open" },
  ];

  const leads = [
    { client: "Matrix Smart", lead: "Matrix Smart", stage: "Assigned", priority: "Hot", executive: "Mani", source: "Website", created: "11/22/2025" },
    { client: "ABC Company", lead: "ABC Company", stage: "Assigned", priority: "Hot", executive: "Mani", source: "Referral", created: "11/18/2025" },
    { client: "Ayesha Cody", lead: "Ayesha Cody", stage: "Installed", priority: "Warm", executive: "Mani", source: "IndiaMart", created: "11/17/2025" },
    { client: "Qube", lead: "Qube", stage: "Won", priority: "Warm", executive: "Mani", source: "IndiaMart", created: "11/15/2025" },
    { client: "Matrix", lead: "Matrix", stage: "Quotation Sent", priority: "Hot", executive: "Mani", source: "IndiaMart", created: "11/15/2025" },
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchesSearch = (...values: (string | number | undefined | null)[]) => {
    if (!normalizedSearch) return true;
    return values.some((value) =>
      (value ?? "")
        .toString()
        .toLowerCase()
        .includes(normalizedSearch),
    );
  };

  const filteredOrderSheets = orderSheets.filter((order) =>
    matchesSearch(order.id, order.lead, order.model, order.status, order.by, order.customerName),
  );
  const filteredApprovals = approvalsQueue.filter((item) =>
    matchesSearch(item.id, item.lead, item.model, item.requestedBy, item.payment, item.discount),
  );
  const filteredLeads = leads.filter((lead) =>
    matchesSearch(lead.client, lead.lead, lead.stage, lead.executive, lead.priority, lead.source),
  );
  const filteredRecentApprovals = recentlyApproved.filter((item) =>
    matchesSearch(item.id, item.lead, item.model, item.requestedBy, item.approvedOn),
  );

  const reportCards = [
    { label: "Monthly target", value: "76% to goal", tone: "indigo" },
    { label: "Average conversion", value: "18%", tone: "emerald" },
    { label: "Avg. response time", value: "1.8 hours", tone: "sky" },
    { label: "Discount approvals", value: "2 pending", tone: "amber" },
  ];

  const orderColumns = [
    { key: "id", label: "Order Sheet" },
    { key: "lead", label: "Lead" },
    { key: "model", label: "Model" },
    { key: "qty", label: "Qty" },
    { key: "total", label: "Total" },
    { key: "by", label: "Submitted By" },
    { key: "on", label: "Submitted On" },
    { key: "action", label: "Action", align: "right" },
  ];
  const approvalColumns = [
    { key: "id", label: "Quotation ID" },
    { key: "lead", label: "Lead" },
    { key: "requestedBy", label: "Requested By" },
    { key: "model", label: "Model" },
    { key: "discount", label: "Discount %" },
    { key: "payment", label: "Payment" },
    { key: "emi", label: "EMI" },
    { key: "created", label: "Created On" },
    { key: "action", label: "Action", align: "right" },
  ];

  const recentColumns = [
    { key: "id", label: "Quotation ID" },
    { key: "lead", label: "Lead" },
    { key: "model", label: "Approved Model" },
    { key: "price", label: "Price" },
    { key: "requestedBy", label: "Requested By" },
    { key: "approvedOn", label: "Approved On" },
  ];

  const leadColumns = [
    { key: "client", label: "Client" },
    { key: "lead", label: "Lead" },
    { key: "stage", label: "Stage" },
    { key: "priority", label: "Priority" },
    { key: "executive", label: "Executive" },
    { key: "source", label: "Source" },
    { key: "created", label: "Created" },
  ];

  
  const openOrderModal = (order: any) => {
    setSelectedOrder(order);
    setVerifyNote("");
    setShowOrderModal(true);
  };

  const openQuoteModal = (quote: any) => {
    setSelectedQuote(quote);
    setApprovedDiscount((quote.requestedDiscount ?? "").toString());
    setApprovedTenor((quote.emiTenor ?? "").toString());
    setManagerComments("");
    setDecision("approve");
    setShowQuoteModal(true);
  };

  const handleQuoteSubmit = async () => {
    if (!selectedQuote) return;
    setActionLoading("quote");
    try {
      await simulateNetwork();
      triggerToast(`Approved ${selectedQuote.lead}`, "success");
    } catch {
      triggerToast("Approval failed. Rolled back changes.", "error");
    } finally {
      setActionLoading(null);
      setShowQuoteModal(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!selectedOrder) return;
    setActionLoading("order");
    try {
      await simulateNetwork();
      triggerToast(`Verified order ${selectedOrder.id}`, "success");
    } catch {
      triggerToast("Verification failed. Rolled back changes.", "error");
    } finally {
      setActionLoading(null);
      setShowOrderModal(false);
    }
  };

const orderRows = filteredOrderSheets.map((order) => ({
    id: <span className="font-semibold text-indigo-700">{order.id}</span>,
    lead: order.lead,
    model: order.model,
    qty: order.qty,
    total: order.total,
    by: order.by,
    on: order.on,
    action: (
      <div className="flex justify-end gap-2">
        <button
          className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
          onClick={() => openOrderModal(order)}
        >
          Review
        </button>
        <button
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
          onClick={() => openOrderModal(order)}
        >
          Verify
        </button>
      </div>
    ),
  }));

const approvalRows = filteredApprovals.map((item) => ({
    id: <span className="font-semibold text-indigo-700">{item.id}</span>,
    lead: item.lead,
    requestedBy: item.requestedBy,
    model: item.model,
    discount: item.discount,
    payment: item.payment,
    emi: item.emi,
    created: item.created,
    action: (
      <button
        className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
        onClick={() => openQuoteModal(item)}
      >
        Review
      </button>
    ),
  }));

const recentRows = filteredRecentApprovals.map((item) => ({
    id: <span className="font-semibold text-emerald-700">{item.id}</span>,
    lead: item.lead,
    model: item.model,
    price: item.price,
    requestedBy: item.requestedBy,
    approvedOn: item.approvedOn,
  }));

  const leadRows = filteredLeads.map((lead) => ({
    client: <span className="font-semibold text-slate-900">{lead.client}</span>,
    lead: lead.lead,
    stage: (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
        {lead.stage}
      </span>
    ),
    priority: (
      <span
        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
          lead.priority === "Hot" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {lead.priority}
      </span>
    ),
    executive: lead.executive,
    source: lead.source,
    created: lead.created,
  }));

  const TableCard = ({
    title,
    columns,
    rows,
    detail,
  }: {
    title: string;
    columns: { key: string; label: string; align?: "left" | "right" }[];
    rows: Record<string, ReactNode>[];
    detail?: ReactNode;
  }) => (
    <Section title={title}>
      {detail}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
          {normalizedSearch ? (
            <>
              No results for <span className="text-slate-900">"{searchTerm}"</span>. Try a different term.
            </>
          ) : (
            "No records to show right now."
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 ${column.align === "right" ? "text-right" : ""}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 ${column.align === "right" ? "text-right" : ""} text-slate-700`}
                    >
                      {row[column.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {pipelineMetrics.map((metric) => (
          // Pastel KPI cards for Sales Manager to match the app theme
          <div
            key={metric.label}
            className={`rounded-2xl border bg-gradient-to-br ${pastelToneStyles[metric.tone].card} p-4 shadow-sm ${pastelToneStyles[metric.tone].shadow} transition hover:-translate-y-[2px] hover:shadow-lg`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${pastelToneStyles[metric.tone].badge}`}
              >
                {metric.code}
              </span>
              <p className="text-sm font-semibold text-slate-700">{metric.label}</p>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 drop-shadow-sm">{metric.value}</p>
          </div>
        ))}
      </div>

      <TableCard
        title="Order Sheets Awaiting Verification"
        columns={orderColumns}
        rows={orderRows}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TableCard
            title="Pending Approvals"
            columns={approvalColumns.filter((column) => column.key !== "requestedBy" && column.key !== "emi")}
            rows={filteredApprovals.map((item) => ({
              id: <span className="font-semibold text-indigo-700">{item.id}</span>,
              lead: item.lead,
              model: item.model,
              discount: item.discount,
              payment: item.payment,
              created: item.created,
              action: (
                <button
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
                  onClick={() => openQuoteModal(item)}
                >
                  Review
                </button>
              ),
            }))}
            detail={
              <div className="flex items-center justify-between pb-3 text-sm font-semibold text-slate-600">
                <span>Quotations awaiting your review</span>
                <button className="text-indigo-600 underline-offset-4 hover:underline">View all</button>
              </div>
            }
          />
        </div>
        <Section title="Sales Executives" subtitle="Performance snapshot">
          <div className="space-y-3">
            {executives.map((exec) => (
              <div
                key={exec.name}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {exec.name[0]}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-slate-900">{exec.name}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        Leads: {exec.leads} | Quotes: {exec.quotes} | Conv: {exec.conversion}
                      </p>
                    </div>
                  </div>
                  <button className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                    {exec.status}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-4">
      <TableCard
        title="Quotations Awaiting Approval"
        columns={approvalColumns}
        rows={approvalRows}
            detail={
              <div className="flex items-center justify-between pb-3 text-sm font-semibold text-slate-600">
                <span>Open list</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              {filteredApprovals.length} pending
                </span>
              </div>
            }
          />

      <TableCard title="Recently Approved" columns={recentColumns} rows={recentRows} />
    </div>
  );
  const renderOrderSheets = () => (
    <TableCard title="Order Sheets" columns={orderColumns} rows={orderRows} />
  );

  const renderLeads = () => (
    <TableCard
      title="Leads"
      columns={leadColumns}
      rows={leadRows}
      detail={
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">Track client, stage, and ownership</p>
          <div className="relative">
            <input
              className="w-64 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              placeholder="Search by client, lead, executive..."
              type="text"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6" />
                <path d="m15.5 15.5 3 3" />
              </svg>
            </span>
          </div>
        </div>
      }
    />
  );

  const renderExecutives = () => (
    <Section title="Team Performance">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {executives.map((exec) => (
          <div
            key={exec.name}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-[2px] hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                  {exec.name[0]}
                </span>
                <div>
                  <p className="text-base font-semibold text-slate-900">{exec.name}</p>
                  <p className="text-xs font-semibold text-slate-500">Conversion: {exec.conversion}</p>
                </div>
              </div>
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                {exec.status}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 px-2 py-2">
                <p className="text-lg font-bold text-slate-900">{exec.leads}</p>
                <p className="text-[11px] font-semibold text-slate-500">Leads</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-2 py-2">
                <p className="text-lg font-bold text-slate-900">{exec.quotes}</p>
                <p className="text-[11px] font-semibold text-slate-500">Quotes</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-2 py-2">
                <p className="text-lg font-bold text-slate-900">0</p>
                <p className="text-[11px] font-semibold text-slate-500">Orders</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );

  const renderReports = () => (
    <Section title="Reports & Analytics">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {reportCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100"
          >
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
            <div
              className={`mt-3 h-2 rounded-full ${
                card.tone === "indigo"
                  ? "bg-gradient-to-r from-indigo-200 to-indigo-500"
                  : card.tone === "emerald"
                    ? "bg-gradient-to-r from-emerald-200 to-emerald-500"
                    : card.tone === "amber"
                      ? "bg-gradient-to-r from-amber-200 to-amber-500"
                      : "bg-gradient-to-r from-sky-200 to-sky-500"
              }`}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-500">
          Export pipeline
        </button>
        <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
          Download approvals
        </button>
        <button className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100">
          View team report
        </button>
      </div>
    </Section>
  );


  const renderQuoteModal = () => {
    if (!showQuoteModal || !selectedQuote) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-md animate-backdrop-in">
        <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">Quotation Review</p>
              <h3 className="text-2xl font-semibold text-slate-900">Quotation {selectedQuote.id}</h3>
              <p className="text-sm font-semibold text-slate-500">Status: submitted (Pending)</p>
            </div>
            <button
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              onClick={() => setShowQuoteModal(false)}
            >
              x
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Quotation Summary</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
                <span>Model:</span>
                <span>{selectedQuote.model}</span>
                <span>Base Price:</span>
                <span>{selectedQuote.basePrice}</span>
                <span>Requested Discount:</span>
                <span>{selectedQuote.requestedDiscount}</span>
                <span>Payment Term:</span>
                <span>{selectedQuote.payment}</span>
                <span>Validity Date:</span>
                <span>{selectedQuote.validityDate}</span>
                <span>Final Price:</span>
                <span>{selectedQuote.finalPrice}</span>
                <span>EMI Tenor:</span>
                <span>{selectedQuote.emiTenor} months</span>
                <span>Installation Charge Payer:</span>
                <span>{selectedQuote.installationPayer ?? "Customer"}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Lead Snapshot</p>
              <div className="mt-3 space-y-1 text-sm font-semibold text-slate-700">
                <p>Company: {selectedQuote.lead}</p>
                <p>Phone: {selectedQuote.leadPhone ?? "--"}</p>
                <p>Source: {selectedQuote.leadSource ?? "--"}</p>
                <p>Priority: {selectedQuote.leadPriority ?? "--"}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-inner shadow-slate-100">
            <p className="text-base font-semibold text-slate-900">Manager Decision</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Decision *</p>
                <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={decision === "approve"}
                      onChange={() => setDecision("approve")}
                    />
                    Approve
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={decision === "reject"}
                      onChange={() => setDecision("reject")}
                    />
                    Reject
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Final Approved Discount %
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    value={approvedDiscount}
                    onChange={(event) => setApprovedDiscount(event.target.value)}
                  />
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Final Approved EMI Tenor (months)
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    value={approvedTenor}
                    onChange={(event) => setApprovedTenor(event.target.value)}
                  />
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Manager Comments
                  <textarea
                    className="mt-2 h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    value={managerComments}
                    onChange={(event) => setManagerComments(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleQuoteSubmit}
                disabled={actionLoading === "quote"}
              >
                {actionLoading === "quote" && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                )}
                {actionLoading === "quote" ? "Saving..." : "Approve Quotation"}
              </button>
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setShowQuoteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderModal = () => {
    if (!showOrderModal || !selectedOrder) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-md animate-backdrop-in">
        <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">Order Sheet</p>
              <h3 className="text-2xl font-semibold text-slate-900">Order Sheet #{selectedOrder.id}</h3>
              <p className="text-sm font-semibold text-slate-500">Status: {selectedOrder.status}</p>
            </div>
            <button
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              onClick={() => setShowOrderModal(false)}
            >
              x
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Summary</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
                <span>Model</span><span>{selectedOrder.model}</span>
                <span>Quantity</span><span>{selectedOrder.qty}</span>
                <span>Unit Price</span><span>{selectedOrder.unitPrice}</span>
                <span>Total Price</span><span>{selectedOrder.total}</span>
                <span>Discount</span><span>{selectedOrder.discountValue}</span>
                <span>Payment Method</span><span>{selectedOrder.paymentMethod}</span>
                <span>Delivery Timeline</span><span>{selectedOrder.deliveryTimeline}</span>
                <span>Shipment Type</span><span>{selectedOrder.shipmentType}</span>
                <span>Customer Name</span><span>{selectedOrder.customerName}</span>
                <span>GST No.</span><span>{selectedOrder.gstNumber}</span>
                <span>Billing Address</span><span>{selectedOrder.billingAddress}</span>
                <span>Shipping Address</span><span>{selectedOrder.shippingAddress}</span>
                <span>Special Request</span><span>{selectedOrder.specialRequest}</span>
                <span>Terms / Notes</span><span>{selectedOrder.termsNotes}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-inner shadow-slate-100">
              <p className="text-sm font-semibold text-slate-800">Approval</p>
              <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
                <p>Submitted: {selectedOrder.on}</p>
                <p>Status: {selectedOrder.status}</p>
                <label className="block space-y-2">
                  <span>Verification Note (optional)</span>
                  <textarea
                    className="h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    value={verifyNote}
                    onChange={(event) => setVerifyNote(event.target.value)}
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={handleVerifySubmit}
                  disabled={actionLoading === "order"}
                >
                  {actionLoading === "order" && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  )}
                  {actionLoading === "order" ? "Verifying..." : "Verify"}
                </button>
                <button
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setShowOrderModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "approvals":
        return renderApprovals();
      case "orders":
        return renderOrderSheets();
      case "leads":
        return renderLeads();
      case "executives":
        return renderExecutives();
      case "reports":
        return renderReports();
      default:
        return renderOverview();
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm shadow-slate-100"
          >
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-full shimmer" />
              <div className="h-3 w-20 rounded-full shimmer" />
            </div>
            <div className="mt-4 h-6 w-12 rounded-full shimmer" />
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100">
        <div className="flex flex-col gap-3">
          <div className="h-4 w-40 rounded-full shimmer" />
          <div className="h-10 w-full rounded-2xl shimmer" />
          <div className="h-10 w-56 rounded-2xl shimmer" />
        </div>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100">
        <div className="h-64 rounded-2xl shimmer" />
      </div>
    </div>
  );

  if (isLoadingPage) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-linear-to-r from-slate-900/60 via-indigo-600/55 to-sky-500/55 p-6 text-white shadow-2xl shadow-indigo-200/60">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-1/3 top-6 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
        </div>
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.back()}
                className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:-translate-y-[1px] hover:bg-white/20"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-white transition group-hover:-translate-x-[1px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
                  Manager dashboard
                </p>
                <h2 className="text-2xl font-semibold leading-tight text-white">
                  Pipeline overview, approvals, and team performance
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm shadow-lg shadow-black/10 ring-1 ring-white/15 backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">
                {profileName.charAt(0) || "M"}
              </div>
              <div className="text-left leading-tight">
                <p className="text-sm font-semibold text-white">{profileName || "Manager"}</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
                  {(roleSlug ?? "Manager").replace(/-/g, " ")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/10 px-3 py-3 text-sm shadow-inner shadow-white/10 backdrop-blur">
            <div className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-white/60">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none"
                placeholder="dd-mm-yyyy"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none"
                placeholder="dd-mm-yyyy"
              />
            </div>
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-white/60"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="m15.5 15.5 3 3" />
              </svg>
              <input
                type="text"
                placeholder="Search leads, orders, executives"
                className="w-56 rounded-xl bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Search
              </button>
            </form>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm shadow-indigo-200 transition hover:-translate-y-[1px] hover:shadow-lg disabled:opacity-60"
              disabled={isRefreshing}
            >
              <span className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""} rounded-full border-2 border-indigo-500 border-t-transparent`} />
              {isRefreshing ? "Refreshing" : "Refresh data"}
            </button>
          </div>
        </div>
      </div>

      <div
        key={`${currentTab}-${dataRefreshKey}`}
        className="space-y-4 animate-fade-in"
      >
        {isRefreshing && (
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
            Smart refresh in progress...
          </div>
        )}
        {renderTabContent()}
      </div>
      {renderQuoteModal()}
      {renderOrderModal()}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg shadow-slate-200 animate-toast-in ${
            toast.tone === "success"
              ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border border-rose-100 bg-rose-50 text-rose-700"
          }`}
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              toast.tone === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {toast.tone === "success" ? "✓" : "!"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
function AccountantDashboard({ profileName }: DashboardProps) {
  const receivables = [
    { label: "0-7 days", value: "₹ 6,20,000", percent: 38, tone: "emerald" },
    { label: "8-15 days", value: "₹ 4,10,000", percent: 25, tone: "sky" },
    { label: "16-30 days", value: "₹ 3,20,000", percent: 20, tone: "amber" },
    { label: "30+ days", value: "₹ 1,30,000", percent: 8, tone: "rose" },
  ];
  const payables = [
    { vendor: "Steel Traders", due: "₹ 2,45,000", aging: "Due in 2d", tone: "rose" },
    { vendor: "Fasteners Ltd", due: "₹ 1,80,000", aging: "Due in 5d", tone: "amber" },
    { vendor: "Logistics Hub", due: "₹ 95,000", aging: "Due in 8d", tone: "sky" },
    { vendor: "Packaging Co", due: "₹ 62,000", aging: "Due in 12d", tone: "emerald" },
  ];
  const taxes = [
    { label: "GST Payable", value: "₹ 1,48,720", detail: "Next filing in 5 days" },
    { label: "GST Collected", value: "₹ 1,86,400", detail: "Set-off ready" },
    { label: "TDS Payable", value: "₹ 82,300", detail: "Due on 7th" },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Finance cockpit
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Hello {profileName}, cash & compliance at a glance.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Monitor receivables, payables, and tax positions in real time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              Cash on hand: ₹ 9.2 Cr
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              Net flow today: +₹ 74.5 L
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              Filing in 5 days
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-slate-50 px-4 py-2 text-sky-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            + Create invoice
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:bg-white/15">
            Reconcile payments
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:bg-white/15">
            Export aging
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "Total Receivables", value: "₹ 14,80,000", subLabel: "↑ ₹ 2.1L vs last week" },
          { label: "Total Payables", value: "₹ 12,40,000", subLabel: "↓ ₹ 80k vs last week" },
          { label: "GST Collected", value: "₹ 1,86,400", subLabel: "Ready for set-off" },
          { label: "GST Payable", value: "₹ 1,48,720", subLabel: "Due in 5 days" },
        ]}
      />
      <Section
        title="Cash flow snapshot"
        subtitle={`Daily overview for ${profileName}`}
        variant="pastel"
      >
        <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-3">
          {[
            { label: "Inflow today", value: "₹ 11,20,000", detail: "+8% vs last week", tone: "emerald" },
            { label: "Outflow today", value: "₹ 1,45,000", detail: "-3% vs last week", tone: "rose" },
            { label: "Net position", value: "+₹ 9,75,000", detail: "After payables", tone: "sky" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-indigo-50 bg-white/90 p-4 shadow-md shadow-indigo-100 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {card.value}
              </p>
              <p
                className={`text-xs font-semibold ${
                  card.tone === "emerald"
                    ? "text-emerald-600"
                    : card.tone === "rose"
                      ? "text-rose-600"
                      : "text-sky-600"
                }`}
              >
                {card.detail}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Receivables aging" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {receivables.map((bucket) => (
            <div
              key={bucket.label}
              className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {bucket.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {bucket.value}
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    bucket.tone === "rose"
                      ? "bg-rose-400"
                      : bucket.tone === "amber"
                        ? "bg-amber-400"
                        : bucket.tone === "sky"
                          ? "bg-sky-400"
                          : "bg-emerald-400"
                  }`}
                  style={{ width: `${bucket.percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {bucket.percent}% of total
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Payables by urgency">
        <div className="grid gap-3 lg:grid-cols-2">
          {payables.map((bill) => (
            <div
              key={bill.vendor}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">
                  {bill.vendor}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    bill.tone === "rose"
                      ? "bg-rose-50 text-rose-600"
                      : bill.tone === "amber"
                        ? "bg-amber-50 text-amber-700"
                        : bill.tone === "sky"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {bill.aging}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {bill.due}
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-sky-400"
                  style={{ width: "68%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tax summary" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-3">
          {taxes.map((tax) => (
            <div
              key={tax.label}
              className="rounded-2xl border border-indigo-50 bg-white/90 p-4 shadow-sm shadow-indigo-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {tax.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {tax.value}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                {tax.detail}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pending tasks">
        <List
          items={[
            "Review 4 invoices due today and trigger reminders",
            "Approve 2 vendor bills for payment run",
            "Prepare GST filing pack (due in 5 days)",
            "Reconcile yesterday’s bank statement",
          ]}
        />
      </Section>

      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Create Invoice",
            "+ Record Payment",
            "+ Add Expense",
            "+ Add Vendor Bill",
            "+ Export Aging",
            "+ Reconcile Bank",
          ]}
        />
      </Section>
    </div>
  );
}

function ServiceEngineerDashboard({ profileName }: DashboardProps) {
  const jobs = [
    { time: "09:15", client: "Kumar Industries", issue: "Motor Overheat", priority: "High", eta: "Onsite", status: "In progress" },
    { time: "12:00", client: "Star Metals", issue: "Alignment Issue", priority: "Medium", eta: "45m", status: "Queued" },
    { time: "15:30", client: "Sri Plastics", issue: "Belt Trouble", priority: "Low", eta: "2h", status: "Queued" },
    { time: "17:10", client: "North Mills", issue: "Sensor Fault", priority: "High", eta: "3h", status: "Queued" },
  ];
  const parts = [
    { name: "Motor Belt", stock: "12 in van", need: 1, status: "Ready" },
    { name: "Sensor Board", stock: "3 in hub", need: 1, status: "Pick up" },
    { name: "Grease Pack", stock: "5 in van", need: 2, status: "Ready" },
    { name: "Fasteners Kit", stock: "Low", need: 1, status: "Order" },
  ];
  const load = [
    { label: "Assigned", value: 6, color: "from-indigo-300 to-indigo-500" },
    { label: "In progress", value: 3, color: "from-amber-300 to-amber-500" },
    { label: "Completed", value: 4, color: "from-emerald-300 to-emerald-500" },
    { label: "Escalations", value: 1, color: "from-rose-300 to-rose-500" },
  ];
  const loadFills = ["#dbeafe", "#fef3c7", "#dcfce7", "#ffe4e6"];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Field ops
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {profileName}, your routes are live.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Track visits, spares, and SLA health on the go.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              Jobs today: 9
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              On-time: 92%
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              Response: 34m avg
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-slate-50 px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            Start next job
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:bg-white/15">
            View route map
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "Jobs Assigned", value: "9", subLabel: "3 in progress" },
          { label: "Completed Today", value: "4", subLabel: "Avg 52m" },
          { label: "Pending Jobs", value: "5", subLabel: "2 high priority" },
          { label: "Escalations", value: "1", subLabel: "Follow-up at 4 PM" },
        ]}
      />

      <Section title="Workload status" variant="pastel">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {load.map((item, index) => (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-4 shadow-[0_18px_45px_rgba(59,130,246,0.12)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(59,130,246,0.18)]"
            >
              <div className="absolute inset-0 opacity-50 blur-2xl bg-white" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl shadow-inner shadow-white/70 ring-2 ring-white/60 transition duration-300 group-hover:scale-105"
                    style={{ backgroundColor: loadFills[index % loadFills.length] }}
                  >
                    <span className="relative text-lg font-extrabold text-slate-900">
                      {item.value}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-600">
                      {item.label}
                    </p>
                    <p className="text-[11px] font-semibold text-indigo-600 opacity-0 transition duration-200 group-hover:opacity-100">
                      Tap for details
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's visit schedule" subtitle="Upcoming calls and priorities">
        <div className="grid gap-3 lg:grid-cols-2">
          {jobs.map((job) => (
            <div
              key={job.client + job.time}
              className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="absolute inset-0 opacity-70 blur-2xl" style={{ background: `radial-gradient(circle at 30% 20%, rgba(59,130,246,0.12), transparent 35%), radial-gradient(circle at 70% 0%, rgba(16,185,129,0.12), transparent 30%)` }} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    {job.time} · {job.client}
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {job.issue}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    ETA: {job.eta}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      job.priority === "High"
                        ? "bg-rose-50 text-rose-600"
                        : job.priority === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {job.priority}
                  </span>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                    {job.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spares readiness" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {parts.map((part) => (
            <div
              key={part.name}
              className="rounded-2xl border border-slate-100 bg-white/90 p-4 text-sm shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {part.name}
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                Stock: {part.stock}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Need: {part.need}
              </p>
              <span
                className={`mt-3 inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold ${
                  part.status === "Ready"
                    ? "bg-emerald-50 text-emerald-700"
                    : part.status === "Pick up"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-600"
                }`}
              >
                {part.status}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Start Job",
            "+ Upload Photo",
            "+ Add Spare Usage",
            "+ Close Job",
            "+ Update ETA",
            "+ Mark Escalation",
          ]}
        />
      </Section>
    </div>
  );
}


function SalesExecutiveDashboard({ profileName }: DashboardProps) {
  type LeadStatus =
    | "New"
    | "Contacted"
    | "Qualified"
    | "Quotation"
    | "Negotiation"
    | "Won"
    | "Lost"
    | "Pending Approval";

  type LeadItem = {
    id: string;
    customer: string;
    phone: string;
    state: string;
    status: LeadStatus;
    model?: string;
    nextAction: string;
    createdAt: string;
    priority: "Hot" | "Warm" | "Cold";
    source: string;
    value: string;
  };

  type Quotation = {
    id: string;
    status: "Draft" | "Submitted" | "Approved" | "PO Received" | "Pending" | "Rejected";
    company: string;
    client: string;
    leadId: string;
    date: string;
    price: string;
    validity: string;
  };

  type OrderForm = {
    model: string;
    totalPrice: string;
    quantity: string;
    customerName: string;
    gstNumber: string;
    contactPerson: string;
    billingAddress: string;
    shippingAddress: string;
    discount: string;
    paymentMethod: string;
    deliveryTimeline: string;
    shipmentType: string;
    specialRequest: string;
    terms: string;
  };

  const stageOrder: LeadStatus[] = [
    "New",
    "Contacted",
    "Qualified",
    "Quotation",
    "Negotiation",
    "Won",
    "Lost",
  ];

  const [activeTab, setActiveTab] = useState<"dashboard" | "quotations" | "orders">("dashboard");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<LeadStatus | "All">("All");
  const [quotationFilter, setQuotationFilter] = useState<Quotation["status"] | "All">("All");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "enrichment" | "quotations" | "exchange">("overview");
  const [toast, setToast] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: string; lng: string } | null>(null);
  const [attachments, setAttachments] = useState<number>(0);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedQuotationForOrder, setSelectedQuotationForOrder] = useState<Quotation | null>(null);
  const defaultOrderForm = (q: Quotation | null = null): OrderForm => ({
    model: q?.company?.includes("CS") ? q.company : "CS-5000",
    totalPrice: q?.price ?? "₹ 8,40,000",
    quantity: "1",
    customerName: q?.client ?? "",
    gstNumber: "11nnjcwedeq",
    contactPerson: q?.client ? q.client.split(" ")[0] ?? "Nisha" : "Nisha",
    billingAddress: "1342,\nMadurai, Tamil Nadu",
    shippingAddress: "",
    discount: "₹ 10,000",
    paymentMethod: "",
    deliveryTimeline: "",
    shipmentType: "",
    specialRequest: "",
    terms: "",
  });
  const [orderForm, setOrderForm] = useState<OrderForm>(defaultOrderForm());

  const [leads, setLeads] = useState<LeadItem[]>([
    {
      id: "CS-251201",
      customer: "Matrix Smart",
      phone: "+91 98400 11223",
      state: "Tamil Nadu",
      status: "Won",
      model: "6979aad8-9de6-4589-b824-6cfbc5099804",
      nextAction: "Review",
      createdAt: "21/11/2025",
      priority: "Warm",
      source: "Existing Client",
      value: "Rs 14,80,000",
    },
    {
      id: "CS-251110",
      customer: "ABC Company",
      phone: "+91 90030 22211",
      state: "Karnataka",
      status: "Pending Approval",
      model: "037e924c-02a5-4ea6-90df-471861a25e96",
      nextAction: "Validate contact",
      createdAt: "21/11/2025",
      priority: "Warm",
      source: "Inbound",
      value: "Rs 13,25,000",
    },
    {
      id: "CS-251109",
      customer: "Summit Agro",
      phone: "+91 98841 12345",
      state: "Telangana",
      status: "Quotation",
      model: "Not set",
      nextAction: "Follow-up call",
      createdAt: "20/11/2025",
      priority: "Hot",
      source: "Expo",
      value: "Rs 12,10,000",
    },
    {
      id: "CS-251108",
      customer: "North Mills",
      phone: "+91 90922 55667",
      state: "Delhi",
      status: "Negotiation",
      model: "6979aad8-9de6-4589-b824-6cfbc5099804",
      nextAction: "Review",
      createdAt: "19/11/2025",
      priority: "Warm",
      source: "Partner",
      value: "Rs 11,45,000",
    },
    {
      id: "CS-251107",
      customer: "Harsha Foods",
      phone: "+91 98989 11122",
      state: "Maharashtra",
      status: "Contacted",
      model: "Not set",
      nextAction: "Enrich data",
      createdAt: "19/11/2025",
      priority: "Cold",
      source: "Web",
      value: "Rs 5,20,000",
    },
  ]);

  const [quotations, setQuotations] = useState<Quotation[]>([
    {
      id: "Q-2025-166609",
      status: "PO Received",
      company: "Matrix Smart",
      client: "Matrix Smart",
      leadId: "CS-251201",
      date: "21/11/2025",
      price: "Rs 1,11,80,000",
      validity: "Valid till 15 Dec",
    },
    {
      id: "Q-2025-771",
      status: "Submitted",
      company: "ABC Company",
      client: "ABC Company",
      leadId: "CS-251110",
      date: "21/11/2025",
      price: "Rs 13,98,000",
      validity: "Valid till 05 Dec",
    },
    {
      id: "Q-2025-668",
      status: "Pending",
      company: "ABC Company",
      client: "ABC Company",
      leadId: "CS-251109",
      date: "21/11/2025",
      price: "Rs 10,00,000",
      validity: "Valid till 07 Dec",
    },
    {
      id: "Q-2025-702",
      status: "Approved",
      company: "Summit Agro",
      client: "Summit Agro",
      leadId: "CS-251108",
      date: "20/11/2025",
      price: "Rs 15,45,000",
      validity: "Valid till 10 Dec",
    },
  ]);

  const filteredLeads = useMemo(() => {
    const search = leadSearch.toLowerCase();
    return leads.filter((lead) => {
      const matchesSearch =
        lead.customer.toLowerCase().includes(search) ||
        lead.id.toLowerCase().includes(search) ||
        lead.phone.toLowerCase().includes(search);
      const matchesStatus = leadStatusFilter === "All" || lead.status === leadStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, leadSearch, leadStatusFilter]);

  const selectedLead =
    selectedLeadId && filteredLeads.find((lead) => lead.id === selectedLeadId)
      ? filteredLeads.find((lead) => lead.id === selectedLeadId) ?? filteredLeads[0] ?? null
      : filteredLeads[0] ?? null;

  useEffect(() => {
    if (selectedLead && selectedLead.id !== selectedLeadId) {
      setSelectedLeadId(selectedLead.id);
    }
  }, [selectedLead, selectedLeadId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const pendingApprovals = leads.filter((lead) => lead.status === "Pending Approval");
  const summaryCards = [
    { label: "My Leads", value: leads.length, sub: "+4 today" },
    { label: "Pending Approvals", value: pendingApprovals.length, sub: "Manager queue" },
    { label: "Quotes Sent", value: quotations.length, sub: "Across active leads" },
  ];

  const filteredQuotations = quotations.filter((q) => quotationFilter === "All" || q.status === quotationFilter);

  const handleActionToast = (message: string) => setToast(message);
  const handleOpenOrderModal = (q: Quotation) => {
    setSelectedQuotationForOrder(q);
    setOrderForm(defaultOrderForm(q));
    setShowOrderModal(true);
  };
  const handleCloseOrderModal = () => {
    setShowOrderModal(false);
    setSelectedQuotationForOrder(null);
  };
  const handleOrderFieldChange = (field: keyof OrderForm, value: string) => {
    setOrderForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleCopyBilling = () => {
    setOrderForm((prev) => ({ ...prev, shippingAddress: prev.billingAddress }));
  };
  const handleOrderSubmit = (mode: "draft" | "submit") => {
    const action = mode === "submit" ? "Order sheet submitted" : "Order sheet created";
    setToast(`${action} (${selectedQuotationForOrder?.id ?? "manual"})`);
    setShowOrderModal(false);
  };
  const handleCaptureGps = () => {
    setGps({ lat: "13.0827", lng: "80.2707" });
    setToast("GPS captured");
  };
  const handleAttach = () => {
    setAttachments((prev) => prev + 1);
    setToast("Attachment added");
  };
  const handlePipelineMove = (nextStatus: LeadStatus) => {
    if (!selectedLead) return;
    setLeads((prev) => prev.map((lead) => (lead.id === selectedLead.id ? { ...lead, status: nextStatus } : lead)));
    setToast(`Stage moved to ${nextStatus}`);
  };
  const handlePrintQuote = (quote: Quotation) => {
    const win = window.open("", "print-quote", "width=900,height=1200");
    if (!win) return;
    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Quotation ${quote.id}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; }
          .row { display: flex; justify-content: space-between; }
          .section { margin-top: 16px; }
          .heading { font-weight: 700; letter-spacing: 0.08em; font-size: 12px; color: #6b7280; }
          .title { font-size: 24px; font-weight: 700; margin: 12px 0; }
          .muted { color: #6b7280; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px; }
          th { text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
          .total { text-align: right; font-weight: 700; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="row">
          <div>
            <div class="title">QUOTATION</div>
            <div class="muted">No. ${quote.id}</div>
            <div class="muted">Date: ${quote.date}</div>
          </div>
          <div style="text-align:right">
            <div class="title" style="font-size:18px;">Qube Technologies</div>
            <div class="muted">Rice Sorting Solutions</div>
          </div>
        </div>
        <div class="section">
          <div class="row">
            <div>
              <div class="heading">From</div>
              <div>Qube Technologies Pvt Ltd</div>
              <div class="muted">sales@qube.tech</div>
              <div class="muted">GST: 33AABCU9603R1ZX</div>
            </div>
            <div>
              <div class="heading">To</div>
              <div>${quote.client}</div>
              <div class="muted">Contact: ${quote.client}</div>
              <div class="muted">Phone: 9080202120</div>
              <div class="muted">GST: 11nnjcwedeq</div>
              <div class="muted">1342, Madurai, Tamil Nadu</div>
            </div>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Items Description</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Total</th></tr>
          </thead>
          <tbody>
            <tr><td>CS-5000 · High-performance rice sorter</td><td style="text-align:right;">₹ 850,000</td><td style="text-align:right;">1</td><td style="text-align:right;">₹ 850,000</td></tr>
          </tbody>
        </table>
        <div class="section total">Subtotal: ${quote.price}</div>
        <div class="section muted">Tax GST 18%: ₹ 153,000 · Discount: ₹ 10,000</div>
        <div class="section total">Total Due: ₹ 993,000</div>
        <div class="section" style="margin-top:32px;">
          <div class="heading">Terms & Conditions</div>
          <div class="muted">Payment due within 30 days. Installation and training included.</div>
        </div>
        <div class="section" style="margin-top:24px; font-weight:700;">Thank you for your business.</div>
      </body>
    </html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-linear-to-r from-slate-900/60 via-indigo-600/55 to-sky-500/55 p-6 text-white shadow-2xl shadow-indigo-200/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">Sales Executive</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Hi {profileName}, keep the funnel moving.</h2>
            <p className="mt-1 text-sm text-white/80">
              Review leads, send quotes, and log follow-ups from one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">Leads today: 12</span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">Win rate: 28%</span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">Follow-ups: 7</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-px hover:shadow-sm">
            + Add lead
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:-translate-y-px hover:bg-white/15">
            Log follow-up
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          {["dashboard", "quotations", "orders"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`rounded-full px-3 py-1.5 transition ${
                activeTab === tab ? "bg-white text-indigo-700 shadow-sm shadow-indigo-200" : "bg-white/15 text-white"
              }`}
            >
              {tab === "dashboard" ? "Dashboard" : tab === "quotations" ? "Quotations" : "Orders"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "dashboard" && (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-px hover:shadow-lg"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="text-xs font-semibold text-slate-600">{card.sub}</p>
              </div>
            ))}
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">My Leads</p>
                  <p className="text-xs text-slate-500">Search and filter by stage</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm font-semibold">
                  {(["All", ...stageOrder] as const).map((stage) => (
                    <button
                      key={stage}
                      className={`rounded-full px-3 py-1 transition ${
                        leadStatusFilter === stage
                          ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      onClick={() => setLeadStatusFilter(stage)}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="6" />
                    <path d="m15.5 15.5 3 3" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search leads, phone, ID"
                    className="w-48 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    value={leadSearch}
                    onChange={(event) => setLeadSearch(event.target.value)}
                  />
                </div>
                <button
                  onClick={() => setLeadSearch("")}
                  className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-200"
                >
                  Clear
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-px hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {lead.customer} <span className="text-xs text-slate-500">({lead.id})</span>
                        </p>
                        <p className="text-xs text-slate-500">{lead.phone}</p>
                        <p className="text-xs text-slate-500">{lead.state}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                        {lead.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2 py-1">Model: {lead.model ?? "Not set"}</span>
                      <span
                        className={`rounded-full px-2 py-1 ${
                          lead.priority === "Hot"
                            ? "bg-rose-50 text-rose-600"
                            : lead.priority === "Warm"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {lead.priority}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">{lead.source}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-600">Next: {lead.nextAction}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <button
                        className="rounded-full bg-indigo-500 px-3 py-1.5 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setDetailTab("overview");
                        }}
                      >
                        Open
                      </button>
                      <button
                        className="rounded-full bg-emerald-500 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                        onClick={() => handleActionToast("Follow-up logged")}
                      >
                        Log follow-up
                      </button>
                      <button
                        className="rounded-full bg-amber-500 px-3 py-1.5 text-white shadow-sm shadow-amber-200 transition hover:bg-amber-400"
                        onClick={() => handleActionToast("Quotation drafted")}
                      >
                        Create quote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Pending approvals</p>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                    {pendingApprovals.length}
                  </span>
                </div>
                {pendingApprovals.length === 0 ? (
                  <p className="mt-2 text-xs font-semibold text-slate-500">No pending approvals.</p>
                ) : (
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    {pendingApprovals.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 shadow-sm shadow-amber-100"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">{lead.customer}</p>
                          <span className="text-[11px] font-semibold text-amber-700">{lead.status}</span>
                        </div>
                        <p className="text-xs text-slate-600">Next: {lead.nextAction}</p>
                        <div className="mt-2 flex gap-2 text-[11px] font-semibold">
                          <button
                            onClick={() => handleActionToast("Request sent to manager")}
                            className="rounded-full bg-indigo-500 px-3 py-1 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                          >
                            Nudge manager
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              setDetailTab("quotations");
                            }}
                            className="rounded-full bg-white px-3 py-1 text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                          >
                            View quote
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedLead && (
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">Lead detail</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                      {selectedLead.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedLead.customer} <span className="text-xs text-slate-500">({selectedLead.id})</span>
                  </p>
                  <p className="text-xs text-slate-600">{selectedLead.phone}</p>
                  <p className="text-xs text-slate-600">{selectedLead.state}</p>
                  <div className="mt-3 flex gap-2 text-xs font-semibold">
                    {["overview", "enrichment", "quotations", "exchange"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab as typeof detailTab)}
                        className={`rounded-full px-3 py-1 transition ${
                          detailTab === tab ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {detailTab === "overview" && (
                    <div className="mt-3 space-y-2 text-xs text-slate-700">
                      <p>
                        Source: <span className="font-semibold">{selectedLead.source}</span>
                      </p>
                      <p>
                        Priority: <span className="font-semibold">{selectedLead.priority}</span>
                      </p>
                      <p>
                        Model: <span className="font-semibold">{selectedLead.model ?? "Not set"}</span>
                      </p>
                      <p>
                        Next action: <span className="font-semibold">{selectedLead.nextAction}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1 text-[11px] font-semibold">
                        {stageOrder.map((stage) => (
                          <button
                            key={stage}
                            onClick={() => handlePipelineMove(stage)}
                            className={`rounded-full px-2 py-1 transition ${
                              selectedLead.status === stage
                                ? "bg-indigo-500 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {stage}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailTab === "enrichment" && (
                    <div className="mt-3 space-y-2 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">GPS Quick Action</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCaptureGps}
                          className="rounded-full bg-indigo-500 px-3 py-1 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                        >
                          Capture GPS
                        </button>
                        {gps && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                            {gps.lat}, {gps.lng}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
                        <button
                          onClick={handleAttach}
                          className="rounded-full bg-emerald-500 px-3 py-1 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                        >
                          Take photo / attach
                        </button>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          {attachments} attachments
                        </span>
                      </div>
                    </div>
                  )}

                  {detailTab === "quotations" && (
                    <div className="mt-3 space-y-2 text-xs text-slate-700">
                      {quotations
                        .filter((q) => q.leadId === selectedLead.id)
                        .map((q) => (
                          <div
                            key={q.id}
                            className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 shadow-sm shadow-slate-100"
                          >
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                              <span>{q.id}</span>
                              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-indigo-700">
                                {q.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {q.company} ? {q.leadId}
                            </p>
                            <p className="text-xs text-slate-600">{q.price}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                              <button
                                onClick={() => handleActionToast("PO viewed")}
                                className="rounded-full bg-white px-3 py-1 text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                              >
                                View PO
                              </button>
                              <button
                                onClick={() => handleOpenOrderModal(q)}
                                className="rounded-full bg-indigo-500 px-3 py-1 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                              >
                                Create order sheet
                              </button>
                              <button
                                onClick={() => handleActionToast("Invoice prepared")}
                                className="rounded-full bg-slate-900 px-3 py-1 text-white shadow-sm transition hover:bg-slate-800"
                              >
                                Prepare invoice
                              </button>
                              <button
                                onClick={() => handlePrintQuote(q)}
                                className="rounded-full bg-white px-3 py-1 text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                              >
                                Print / PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      {quotations.filter((q) => q.leadId === selectedLead.id).length === 0 && (
                        <p className="text-xs font-semibold text-slate-500">No quotations yet.</p>
                      )}
                    </div>
                  )}

                  {detailTab === "exchange" && (
                    <div className="mt-3 space-y-2 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">Exchange details</p>
                      <p className="text-xs text-slate-500">Model name: Pending</p>
                      <p className="text-xs text-slate-500">Recent exchange activity: None</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === "quotations" && (
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Quotations</p>
              <p className="text-xs text-slate-500">Filter by status and manage documents</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {(["All", "Draft", "Submitted", "Approved", "PO Received", "Pending", "Rejected"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setQuotationFilter(status)}
                    className={`rounded-full px-3 py-1 transition ${
                      quotationFilter === status
                        ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {filteredQuotations.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-100 bg-linear-to-r from-white to-slate-50 p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-px hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{q.id}</p>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                    {q.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {q.company} ? {q.client}
                </p>
                <p className="text-xs text-slate-600">Lead: {q.leadId}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{q.price}</p>
                <p className="text-xs text-slate-500">{q.validity}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                  <button
                    onClick={() => handleActionToast("Quotation opened")}
                    className="rounded-full bg-white px-3 py-1 text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleActionToast("PO viewed")}
                    className="rounded-full bg-white px-3 py-1 text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                  >
                    View PO
                  </button>
                  <button
                    onClick={() => handleOpenOrderModal(q)}
                    className="rounded-full bg-indigo-500 px-3 py-1 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                  >
                    Create order sheet
                  </button>
                  <button
                    onClick={() => handleActionToast("Invoice prepared")}
                    className="rounded-full bg-slate-900 px-3 py-1 text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Prepare invoice
                  </button>
                  <button
                    onClick={() => handlePrintQuote(q)}
                    className="rounded-full bg-white px-3 py-1 text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleActionToast("Proforma generated")}
                    className="rounded-full bg-emerald-500 px-3 py-1 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                  >
                    Generate proforma
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-100">
          Orders workspace coming soon. Track PO to dispatch to installation here.
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl shadow-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Create Order Sheet</h3>
                {selectedQuotationForOrder && (
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    From {selectedQuotationForOrder.id} · {selectedQuotationForOrder.company}
                  </p>
                )}
              </div>
              <button
                onClick={handleCloseOrderModal}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 text-sm font-semibold text-slate-700">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span>Model</span>
                  <input
                    value={orderForm.model}
                    onChange={(e) => handleOrderFieldChange("model", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="space-y-2">
                  <span>Total Price</span>
                  <input
                    value={orderForm.totalPrice}
                    onChange={(e) => handleOrderFieldChange("totalPrice", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span>Quantity</span>
                <input
                  value={orderForm.quantity}
                  onChange={(e) => handleOrderFieldChange("quantity", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="space-y-2">
                <span>Customer Name</span>
                <input
                  value={orderForm.customerName}
                  onChange={(e) => handleOrderFieldChange("customerName", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span>GST No.</span>
                  <input
                    value={orderForm.gstNumber}
                    onChange={(e) => handleOrderFieldChange("gstNumber", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="space-y-2">
                  <span>Contact Person</span>
                  <input
                    value={orderForm.contactPerson}
                    onChange={(e) => handleOrderFieldChange("contactPerson", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span>Billing Address</span>
                <textarea
                  rows={2}
                  value={orderForm.billingAddress}
                  onChange={(e) => handleOrderFieldChange("billingAddress", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Shipping Address</span>
                  <button
                    onClick={handleCopyBilling}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Copy billing → shipping
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={orderForm.shippingAddress}
                  onChange={(e) => handleOrderFieldChange("shippingAddress", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <label className="space-y-2">
                <span>Discount (from Quotation)</span>
                <input
                  value={orderForm.discount}
                  onChange={(e) => handleOrderFieldChange("discount", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2">
                  <span>Payment Method</span>
                  <input
                    value={orderForm.paymentMethod}
                    onChange={(e) => handleOrderFieldChange("paymentMethod", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="space-y-2">
                  <span>Delivery Timeline</span>
                  <input
                    value={orderForm.deliveryTimeline}
                    onChange={(e) => handleOrderFieldChange("deliveryTimeline", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="space-y-2">
                  <span>Shipment Type</span>
                  <input
                    value={orderForm.shipmentType}
                    onChange={(e) => handleOrderFieldChange("shipmentType", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span>Special Request</span>
                <textarea
                  rows={2}
                  value={orderForm.specialRequest}
                  onChange={(e) => handleOrderFieldChange("specialRequest", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="space-y-2">
                <span>Terms / Notes</span>
                <textarea
                  rows={3}
                  value={orderForm.terms}
                  onChange={(e) => handleOrderFieldChange("terms", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  onClick={handleCloseOrderModal}
                  className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleOrderSubmit("submit")}
                  className="rounded-full bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:bg-slate-800"
                >
                  Create &amp; Submit
                </button>
                <button
                  onClick={() => handleOrderSubmit("draft")}
                  className="rounded-full bg-indigo-500 px-4 py-2 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-200">
          {toast}
        </div>
      )}
    </div>
  );
}
function ServiceManagerDashboard({ profileName }: DashboardProps) {
  const escalations = [
    { ticket: "T-298", issue: "Motor overheating", age: "2h 15m", status: "Escalated", priority: "High" },
    { ticket: "T-285", issue: "Sensor fault", age: "4h 20m", status: "Pending RCA", priority: "Medium" },
    { ticket: "T-279", issue: "HMI reboot", age: "6h 05m", status: "Waiting parts", priority: "Low" },
  ];
  const visits = [
    "08:30 AM – Arora Foods – Dryer vibration",
    "12:00 PM – North Mills – Camera calibration",
    "03:30 PM – Summit Agro – Belt replacement",
    "05:30 PM – Chennai Agro – Nozzle calibration",
  ];
  const dispatch = [
    { zone: "North", jobs: 5, eta: "28m", score: 82 },
    { zone: "Central", jobs: 4, eta: "36m", score: 75 },
    { zone: "South", jobs: 6, eta: "42m", score: 68 },
    { zone: "West", jobs: 3, eta: "24m", score: 88 },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Service manager
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {profileName}, keep the field humming.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Monitor workload, dispatch efficiency, and escalations in one view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Live tickets: 18
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              SLA on-time: 91%
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Dispatch avg: 32m
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            View dispatch
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/10">
            Escalation board
          </button>
        </div>
      </div>

      <Section
        title="Service status overview"
        subtitle={`Snapshot for ${profileName}`}
        variant="pastel"
      >
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-4">
          {[
            { label: "Pending", value: "8", color: "from-rose-100 to-rose-200" },
            { label: "In Progress", value: "5", color: "from-amber-100 to-amber-200" },
            { label: "Completed Today", value: "4", color: "from-emerald-100 to-emerald-200" },
            { label: "Escalated", value: "1", color: "from-indigo-100 to-indigo-200" },
          ].map((status) => (
            <div
              key={status.label}
              className="rounded-2xl border border-white/70 bg-white/90 p-4 text-center shadow-sm shadow-indigo-50 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <div
                className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${status.color} text-lg font-semibold text-slate-900 shadow-inner shadow-white`}
              >
                {status.value}
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {status.label}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's scheduled visits" subtitle="Keep routes tight">
        <List items={visits} />
      </Section>

      <Section title="Dispatch efficiency" subtitle="Zone performance" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dispatch.map((row) => (
            <div
              key={row.zone}
              className="rounded-2xl border border-slate-100 bg-white/90 p-4 text-sm shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">{row.zone}</p>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                  {row.jobs} jobs
                </span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                ETA {row.eta}
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-emerald-400"
                  style={{ width: `${row.score}%` }}
                />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Performance: {row.score}%
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Escalations board" subtitle="Unblock high-priority tickets">
        <div className="grid gap-3 lg:grid-cols-3">
          {escalations.map((item) => (
            <div
              key={item.ticket}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">
                  {item.ticket}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    item.priority === "High"
                      ? "bg-rose-50 text-rose-600"
                      : item.priority === "Medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {item.priority}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {item.issue}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {item.status} · Age {item.age}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Create Work Order",
            "+ Add Complaint",
            "+ Assign Technician",
            "+ Escalate Ticket",
            "+ Update ETA",
          ]}
        />
      </Section>
    </div>
  );
}

type HrKpi = { label: string; value: number | string; detail?: string; trend?: string };
type HrData = {
  filters: {
    locations: string[];
    departments: string[];
    dateRanges: string[];
  };
  kpis: { primary: HrKpi[]; secondary: { label: string; value: number | string; insight: string }[] };
  navCards: string[];
  quickActions: string[];
  attendance: {
    summary: { total: number; present: number; absent: number; leave: number; onField: number; unmarked: number };
    rows: Array<{
      department: string;
      total: number;
      present: number;
      absent: number;
      leave: number;
      onField: number;
      unmarked: number;
      presentPercent: number;
    }>;
  };
  approvals: Array<{
    type: string;
    reqId: string;
    employee: string;
    dept: string;
    details: string;
    requestedOn: string;
    ageing: string;
  }>;
  joiningsExits: Array<{
    type: string;
    title: string;
    dept: string;
    location: string;
    date: string;
    status: string;
  }>;
  recruitment: Array<{
    position: string;
    dept: string;
    location: string;
    requiredBy: string;
    pipeline: number;
    stage: string;
    risk: string;
  }>;
  skills: Array<{
    employee: string;
    dept: string;
    certification: string;
    issuer: string;
    expiry: string;
    risk: string;
  }>;
  fieldStatus: Array<{
    technician: string;
    region: string;
    skill: string;
    firstJob: string;
    jobsToday: number;
    checkInStatus: string;
    lastUpdated: string;
  }>;
  analytics: {
    headcount: Array<{ label: string; value: number }>;
    attrition: Array<{ label: string; value: number }>;
    overtimeByDept: Array<{ label: string; value: number }>;
    leaveDistribution: Array<{ label: string; value: number }>;
  };
};

const hrDefaults: HrData = {
  filters: {
    locations: ["All Locations", "HO", "Factory-Coimbatore", "Service-South", "Service-North"],
    departments: ["All", "Production", "Sales", "Service", "Stores", "Accounts", "Management"],
    dateRanges: ["Today", "This Week", "This Month", "Last 30 Days", "Custom"],
  },
  kpis: {
    primary: [
      { label: "Total Employees", value: 138, detail: "On-roll headcount", trend: "+6 quarterly" },
      { label: "Present Today", value: 124, detail: "All locations", trend: "89.9%" },
      { label: "Today's Absentees", value: 14, detail: "4 unplanned", trend: "+2 vs yesterday" },
      { label: "Pending HR Approvals", value: 19, detail: "Leave, expenses, attendance", trend: "7 due today" },
      { label: "Open Positions", value: 5, detail: "Recruitment ongoing", trend: "2 offers sent" },
      { label: "Attrition (12M)", value: "8.5%", detail: "Rolling attrition", trend: "Stable" },
    ],
    secondary: [
      { label: "Overtime (This Month)", value: "212 hrs", insight: "High in Production" },
      { label: "Training Coverage", value: "78%", insight: "Target: 90%" },
      { label: "Leave Utilization", value: "62%", insight: "YTD usage" },
      { label: "Certification Expiry (30 Days)", value: 5, insight: "3 Service, 2 Electrical" },
    ],
  },
  navCards: [
    "Employee Directory",
    "Attendance & Shifts",
    "Leave Management",
    "Travel & Expense",
    "Recruitment & Onboarding",
    "Training & Skill Matrix",
    "Performance & Appraisals",
    "HR Analytics",
  ],
  quickActions: [
    "+ Add Employee",
    "Approve Today's Leaves",
    "Approve Regularizations",
    "Approve Expenses",
    "Publish Shift Roster",
    "Assign Training",
    "Export Attendance (Payroll)",
    "Download HR MIS",
  ],
  attendance: {
    summary: { total: 138, present: 124, absent: 14, leave: 7, onField: 32, unmarked: 3 },
    rows: [
      { department: "Production", total: 44, present: 38, absent: 2, leave: 3, onField: 0, unmarked: 1, presentPercent: 86 },
      { department: "Service", total: 41, present: 33, absent: 3, leave: 0, onField: 5, unmarked: 0, presentPercent: 80 },
      { department: "Sales", total: 22, present: 19, absent: 1, leave: 0, onField: 2, unmarked: 0, presentPercent: 86 },
      { department: "Stores", total: 9, present: 8, absent: 0, leave: 1, onField: 0, unmarked: 0, presentPercent: 89 },
      { department: "Accounts", total: 13, present: 12, absent: 1, leave: 0, onField: 0, unmarked: 0, presentPercent: 92 },
      { department: "Management", total: 9, present: 8, absent: 0, leave: 1, onField: 0, unmarked: 0, presentPercent: 89 },
    ],
  },
  approvals: [
    { type: "Leave", reqId: "LV-091", employee: "Praveen Kumar", dept: "Service", details: "2 days Sick Leave", requestedOn: "24 Nov", ageing: "1 day" },
    { type: "Expense", reqId: "EX-144", employee: "Divya S", dept: "Sales", details: "Rs 13,250", requestedOn: "23 Nov", ageing: "2 days" },
    { type: "Attendance", reqId: "AT-057", employee: "Selvam", dept: "Production", details: "Missed punch", requestedOn: "24 Nov", ageing: "1 day" },
    { type: "Roster", reqId: "RS-017", employee: "Sathish", dept: "Production", details: "Shift B -> General", requestedOn: "24 Nov", ageing: "<1 day" },
  ],
  joiningsExits: [
    { type: "Joining", title: "Service Engineer Trainee", dept: "Service", location: "Factory", date: "02 Dec", status: "Offer Accepted" },
    { type: "Joining", title: "Accounts Executive", dept: "Accounts", location: "HO", date: "05 Dec", status: "Shortlisted" },
    { type: "Exit", title: "Mohanraj", dept: "Stores", location: "Factory", date: "30 Nov", status: "Notice Period" },
  ],
  recruitment: [
    { position: "Service Engineer", dept: "Service", location: "Madurai", requiredBy: "10 Dec", pipeline: 6, stage: "Interview", risk: "On Track" },
    { position: "Stores Supervisor", dept: "Stores", location: "Factory", requiredBy: "15 Dec", pipeline: 2, stage: "Sourcing", risk: "At Risk" },
    { position: "Production Operator", dept: "Production", location: "Factory", requiredBy: "01 Jan", pipeline: 4, stage: "Sourcing", risk: "On Track" },
  ],
  skills: [
    { employee: "Suresh P", dept: "Service", certification: "Electrical Safety - HT", issuer: "TNEB", expiry: "12 Dec", risk: "High" },
    { employee: "Arun K", dept: "Service", certification: "Sorter Installation Master", issuer: "Internal", expiry: "20 Dec", risk: "Medium" },
    { employee: "Vimal", dept: "Production", certification: "Forklift License", issuer: "RTO", expiry: "05 Jan", risk: "Medium" },
  ],
  fieldStatus: [
    { technician: "Arun K", region: "Coimbatore", skill: "Installation", firstJob: "9:15 AM", jobsToday: 3, checkInStatus: "On Job", lastUpdated: "10:22 AM" },
    { technician: "Mahesh", region: "Guntur", skill: "Calibration", firstJob: "-", jobsToday: 2, checkInStatus: "Not Checked-in", lastUpdated: "-" },
    { technician: "Kumar", region: "Davanagere", skill: "Electrical", firstJob: "8:50 AM", jobsToday: 4, checkInStatus: "Checked-in", lastUpdated: "10:05 AM" },
  ],
  analytics: {
    headcount: [
      { label: "Aug", value: 126 },
      { label: "Sep", value: 128 },
      { label: "Oct", value: 133 },
      { label: "Nov", value: 138 },
    ],
    attrition: [
      { label: "Aug", value: 9.1 },
      { label: "Sep", value: 8.9 },
      { label: "Oct", value: 8.7 },
      { label: "Nov", value: 8.5 },
    ],
    overtimeByDept: [
      { label: "Production", value: 110 },
      { label: "Service", value: 48 },
      { label: "Sales", value: 18 },
      { label: "Stores", value: 12 },
    ],
    leaveDistribution: [
      { label: "CL", value: 38 },
      { label: "SL", value: 24 },
      { label: "EL", value: 18 },
      { label: "Comp Off", value: 12 },
    ],
  },
};

function HrDashboard({ profileName: _profileName }: DashboardProps) {
  void _profileName;
  const [data, setData] = useState<HrData>(hrDefaults);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: data.filters.locations[0],
    department: data.filters.departments[0],
    dateRange: data.filters.dateRanges[0],
  });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/hr-dashboard");
        if (!response.ok) {
          throw new Error("Request failed");
        }
        const payload = (await response.json()) as { data: HrData };
        if (active && payload?.data) {
          setData(payload.data);
          setFilters({
            location: payload.data.filters.locations[0] ?? "All Locations",
            department: payload.data.filters.departments[0] ?? "All",
            dateRange: payload.data.filters.dateRanges[0] ?? "Today",
          });
        }
      } catch {
        // keep defaults
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const triggerToast = (message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c45b0] via-[#4b6be0] to-[#7a8ff5] p-6 text-white shadow-2xl shadow-[#3c45b0]/35 transition hover:shadow-[0_25px_80px_rgba(60,69,176,0.45)]">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-100 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">Colorsort360</p>
            <div className="mt-2 flex items-center gap-3 text-2xl font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner shadow-white/20 backdrop-blur">
                <span className="text-xl">HR</span>
              </div>
              <span>HR Dashboard</span>
            </div>
            <p className="mt-1 text-sm text-slate-100 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
              Workforce, attendance, approvals, and compliance in one view.
            </p>
          </div>
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search employee / code / mobile / request ID"
              className="w-full rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm text-white placeholder:text-slate-100 shadow-inner shadow-white/10 outline-none backdrop-blur transition focus:border-[#7d83ff] focus:ring-2 focus:ring-[#7d83ff]/40"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-200">
              Enter
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-lg shadow-slate-200">
        <div className="grid gap-3 md:grid-cols-3">
          {renderFilter("Location", data.filters.locations, filters.location, (value) => setFilters((f) => ({ ...f, location: value })))}
          {renderFilter("Department", data.filters.departments, filters.department, (value) => setFilters((f) => ({ ...f, department: value })))}
          {renderFilter("Date Range", data.filters.dateRanges, filters.dateRange, (value) => setFilters((f) => ({ ...f, dateRange: value })))}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() =>
              setFilters({
                location: data.filters.locations[0],
                department: data.filters.departments[0],
                dateRange: data.filters.dateRanges[0],
              })
            }
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.kpis.primary.map((kpi, index) => (
          <div
            key={kpi.label}
            className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_15px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(15,23,42,0.14)]"
          >
            <div className="absolute inset-0 opacity-70 blur-2xl" style={{ background: `radial-gradient(circle at 30% 20%, rgba(34,211,238,0.25), transparent 40%), radial-gradient(circle at 70% 0%, rgba(16,185,129,0.25), transparent 35%)` }} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{kpi.label}</p>
                <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-slate-900">
                  <span>{kpi.value}</span>
                  {kpi.trend && (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                      {kpi.trend}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{kpi.detail}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-sky-50 text-slate-700 shadow-inner shadow-white">
                #{index + 1}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.kpis.secondary.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-md shadow-slate-100 transition hover:-translate-y-[2px] hover:shadow-lg"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{kpi.value}</p>
            <p className="text-xs font-semibold text-amber-600">{kpi.insight}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Section title="HR Modules" variant="pastel">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.navCards.map((item) => (
              <button
                key={item}
                onClick={() => triggerToast(`${item} (demo preview)`)}
                className="group flex items-center justify-between rounded-2xl border border-indigo-50 bg-gradient-to-br from-white via-[#eef2ff] to-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm shadow-indigo-100 transition hover:-translate-y-[2px] hover:border-indigo-100 hover:shadow-lg"
              >
                <span>{item}</span>
                <span className="rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 transition group-hover:bg-emerald-100">
                  Open
                </span>
              </button>
            ))}
          </div>
        </Section>
        <Section title="Quick actions" variant="pastel">
          <div className="grid gap-2 sm:grid-cols-2">
            {data.quickActions.map((action, idx) => {
              const swatches = [
                "#9BC3E7", // light blue
                "#ACB6E3", // periwinkle
                "#8BE1D5", // teal mint
                "#C9E7EB", // soft aqua
                "#F9E899", // pale yellow
                "#F7C27A", // soft amber
                "#F5A3A6", // coral pink
              ];
              const background = swatches[idx % swatches.length];
              return (
              <button
                key={action}
                onClick={() => triggerToast(`${action} (demo action)`)}
                style={{ background }}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 shadow-md shadow-slate-200 transition hover:-translate-y-[2px] hover:shadow-xl hover:shadow-slate-300"
              >
                {action}
              </button>
            );
            })}
          </div>
        </Section>
      </div>

      <Section
        title="Attendance snapshot"
        subtitle="Live department attendance"
        variant="pastel"
      >
        <div className="flex flex-wrap gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <Tag label={`Total: ${data.attendance.summary.total}`} />
          <Tag label={`Present: ${data.attendance.summary.present}`} tone="emerald" />
          <Tag label={`Absent: ${data.attendance.summary.absent}`} tone="rose" />
          <Tag label={`On Leave: ${data.attendance.summary.leave}`} />
          <Tag label={`On Field: ${data.attendance.summary.onField}`} tone="sky" />
          <Tag label={`Unmarked: ${data.attendance.summary.unmarked}`} tone="amber" />
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.25em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">On Leave</th>
                <th className="px-4 py-3">On Field</th>
                <th className="px-4 py-3">Unmarked</th>
                <th className="px-4 py-3">Present %</th>
              </tr>
            </thead>
            <tbody>
              {data.attendance.rows.map((row) => (
                <tr key={row.department} className="border-t border-slate-100 bg-white transition hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.department}</td>
                  <td className="px-4 py-3">{row.total}</td>
                  <td className="px-4 py-3 text-emerald-700">{row.present}</td>
                  <td className="px-4 py-3 text-rose-600">{row.absent}</td>
                  <td className="px-4 py-3">{row.leave}</td>
                  <td className="px-4 py-3 text-sky-700">{row.onField}</td>
                  <td className="px-4 py-3 text-amber-700">{row.unmarked}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ inlineSize: `${Math.min(row.presentPercent, 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{row.presentPercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Pending approvals" variant="pastel">
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.25em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Req ID</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Ageing</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.approvals.map((row) => (
                  <tr key={row.reqId} className="border-t border-slate-100 bg-white transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.type}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500">{row.reqId}</td>
                    <td className="px-4 py-3">{row.employee}</td>
                    <td className="px-4 py-3">{row.dept}</td>
                    <td className="px-4 py-3">{row.details}</td>
                    <td className="px-4 py-3">{row.requestedOn}</td>
                    <td className="px-4 py-3 text-amber-700">{row.ageing}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          triggerToast(`Reviewing ${row.type} ${row.reqId} (mock)`)
                        }
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Joinings & exits" variant="pastel">
          <div className="space-y-3">
            {data.joiningsExits.map((row) => (
              <div
                key={`${row.type}-${row.title}-${row.date}`}
                onClick={() =>
                  triggerToast(`${row.type}: ${row.title} (${row.status})`)
                }
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{row.type}</p>
                  <p className="text-base font-semibold text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-500">
                    {row.dept} • {row.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{row.date}</p>
                  <p className="text-xs font-semibold text-emerald-600">{row.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Recruitment overview" variant="pastel">
          <div className="space-y-3">
            {data.recruitment.map((row) => (
              <div
                key={`${row.position}-${row.location}`}
                onClick={() =>
                  triggerToast(`Recruiting ${row.position} (${row.stage}, ${row.risk})`)
                }
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">{row.position}</p>
                  <p className="text-xs text-slate-500">
                    {row.dept} • {row.location}
                  </p>
                  <p className="text-xs text-slate-500">Pipeline: {row.pipeline}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Required</p>
                  <p className="text-sm font-semibold text-slate-900">{row.requiredBy}</p>
                  <p className={`text-xs font-semibold ${row.risk.includes("Risk") ? "text-rose-600" : "text-emerald-600"}`}>
                    {row.stage} • {row.risk}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Skills & certification alerts" variant="pastel">
          <div className="space-y-3">
            {data.skills.map((row) => (
              <div
                key={`${row.employee}-${row.certification}`}
                onClick={() =>
                  triggerToast(`Skill alert: ${row.employee} (${row.certification})`)
                }
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">{row.employee}</p>
                  <p className="text-xs text-slate-500">
                    {row.dept} • {row.certification}
                  </p>
                  <p className="text-xs text-slate-500">Issuer: {row.issuer}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Expiry</p>
                  <p className="text-sm font-semibold text-slate-900">{row.expiry}</p>
                  <p className={`text-xs font-semibold ${row.risk === "High" ? "text-rose-600" : "text-amber-600"}`}>
                    {row.risk} risk
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Field force status" variant="pastel">
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.25em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Skill</th>
                  <th className="px-4 py-3">First Job</th>
                  <th className="px-4 py-3">Jobs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.fieldStatus.map((row) => (
                  <tr
                    key={row.technician}
                    onClick={() =>
                      triggerToast(`Technician ${row.technician}: ${row.checkInStatus}`)
                    }
                    className="border-t border-slate-100 bg-white transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.technician}</td>
                    <td className="px-4 py-3">{row.region}</td>
                    <td className="px-4 py-3">{row.skill}</td>
                    <td className="px-4 py-3">{row.firstJob}</td>
                    <td className="px-4 py-3">{row.jobsToday}</td>
                    <td className="px-4 py-3">
                      <Tag label={row.checkInStatus} tone={row.checkInStatus.includes("Not") ? "rose" : "emerald"} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{row.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="HR analytics" variant="pastel">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniChart title="Headcount vs Time" data={data.analytics.headcount} colorClass="from-emerald-300 to-emerald-500" />
            <MiniChart title="Attrition Trend" data={data.analytics.attrition} colorClass="from-amber-300 to-amber-500" />
            <MiniChart title="Overtime by Department" data={data.analytics.overtimeByDept} colorClass="from-sky-300 to-sky-500" bar />
            <MiniChart title="Leave Type Distribution" data={data.analytics.leaveDistribution} colorClass="from-indigo-300 to-indigo-500" bar />
          </div>
        </Section>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-200">
            <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
            Syncing HR data...
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-300 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {toast}
        </div>
      )}
    </div>
  );
}

const renderFilter = (
  label: string,
  options: string[],
  value: string,
  onChange: (value: string) => void,
) => (
  <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
    {label}
    <select
      value={value}
      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
        onChange(event.target.value)
      }
      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const Tag = ({ label, tone = "slate" }: { label: string; tone?: "slate" | "emerald" | "rose" | "sky" | "amber" }) => {
  const toneMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneMap[tone] ?? toneMap.slate}`}>{label}</span>;
};

const MiniChart = ({
  title,
  data,
  colorClass,
  bar = false,
}: {
  title: string;
  data: Array<{ label: string; value: number }>;
  colorClass: string;
  bar?: boolean;
}) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{title}</p>
      <div className="mt-3 flex items-end gap-2">
        {data.map((item) => (
          <div key={item.label} className="flex-1 text-center">
            <div
              className={`mx-auto w-full rounded-xl bg-gradient-to-t ${colorClass}`}
              style={{
                blockSize: `${Math.max((item.value / maxValue) * 90, 10)}px`,
              }}
            />
            <p className="mt-1 text-xs font-semibold text-slate-600">{item.label}</p>
            <p className="text-xs text-slate-500">{item.value}</p>
          </div>
        ))}
      </div>
      {!bar && <p className="mt-2 text-xs text-slate-500">Data synced from Supabase (fallback to sample if table missing).</p>}
    </div>
  );
};
