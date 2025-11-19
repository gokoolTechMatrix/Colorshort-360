"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getRoleFromEmail } from "@/lib/role-map";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ??
  "admin@qube.com";

const slugifyRole = (role?: string | null) =>
  role?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ??
  "";

type SidebarIconProps = { className?: string };

type SidebarLink = {
  label: string;
  href: string;
  Icon: (props: SidebarIconProps) => ReactElement;
};

const DashboardIcon = ({ className }: SidebarIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12h8V3H3v9zM13 3h8v6h-8zM13 13h8v8h-8zM3 15h8v6H3z" />
  </svg>
);

const ReportsIcon = ({ className }: SidebarIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 4h14v16H5z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);

const InventoryIcon = ({ className }: SidebarIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 12l9 4 9-4" />
    <path d="M3 17l9 4 9-4" />
  </svg>
);

const ClientsIcon = ({ className }: SidebarIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="10" r="3" />
    <path d="M4 20a5 5 0 0 1 10 0" />
    <path d="M14 20a4 4 0 0 1 8 0" />
  </svg>
);

const SupportIcon = ({ className }: SidebarIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7a5 5 0 0 0-5 5v1a3 3 0 0 0 3 3h2" />
    <path d="M15 7a5 5 0 0 1 5 5v1a3 3 0 0 1-3 3h-2v1" />
  </svg>
);

const baseSidebarLinks: SidebarLink[] = [
  { label: "Dashboard", href: "/dashboard", Icon: DashboardIcon },
  { label: "Reports & Exports", href: "/reports", Icon: ReportsIcon },
  { label: "Inventory", href: "/inventory", Icon: InventoryIcon },
  { label: "Clients", href: "/clients", Icon: ClientsIcon },
  { label: "Support", href: "/support", Icon: SupportIcon },
];

type DashboardProps = { profileName: string };
type DashboardConfig = {
  title: string;
  Component: (props: DashboardProps) => ReactElement;
};

const dashboards: Record<string, DashboardConfig> = {
  "store-incharge": {
    title: "Store Incharge Dashboard",
    Component: StoreInchargeDashboard,
  },
  "purchase-manager": {
    title: "Purchase Manager Dashboard",
    Component: PurchaseManagerDashboard,
  },
  "service-co-ordinator": {
    title: "Service Co-ordinator Dashboard",
    Component: ServiceCoordinatorDashboard,
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
  const [isChecking, setIsChecking] = useState(true);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-50">
      <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/95 p-6 lg:flex">
        <div className="mb-6 flex flex-col items-center text-center text-sm">
          <Image
            src="/image.png"
            alt="Colorsort360 logo"
            width={80}
            height={80}
            priority
            className="mb-3 h-20 w-20 rounded-2xl border border-slate-100 object-contain p-2"
          />
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-400">
            Colorsort360
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            Hi, {profileName}
          </p>
        </div>
        <nav className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          {baseSidebarLinks.map(({ Icon, ...link }) => {
            const isActive = link.href === "/dashboard";
            return (
              <button
                key={link.label}
                onClick={() => link.href !== "#" && router.push(link.href)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-slate-100 ${
                  isActive ? "bg-indigo-50 text-indigo-600" : ""
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-slate-500 ${
                    isActive
                      ? "border-indigo-100 bg-indigo-50 text-indigo-600"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 px-6 py-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">
            Secure workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
        </header>
        <Component profileName={profileName} />
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
}: {
  items: Array<{ label: string; value: string; subLabel?: string }>;
}) {
  const gradients = [
    "from-indigo-100 via-white to-indigo-50",
    "from-rose-100 via-white to-rose-50",
    "from-amber-100 via-white to-amber-50",
    "from-emerald-100 via-white to-emerald-50",
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`group rounded-3xl border border-white/60 bg-gradient-to-br ${gradients[index % gradients.length]} p-5 shadow-lg shadow-slate-100 transition hover:-translate-y-1 hover:shadow-xl`}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {item.value}
          </p>
          {item.subLabel && (
            <p className="mt-1 text-sm text-slate-600">{item.subLabel}</p>
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
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-slate-100 bg-white/90 p-6 shadow-[0_25px_85px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_30px_110px_rgba(15,23,42,0.12)]">
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

function StoreInchargeDashboard({ profileName }: DashboardProps) {
  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "Total Stock Value", value: "₹12,40,000" },
          { label: "Low Stock Items", value: "8" },
          { label: "Today GRNs", value: "3" },
          { label: "Material Issues", value: "5" },
        ]}
      />
      <Section subtitle={`Overview for ${profileName}`} title="Stock overview">
        <div className="space-y-4 text-sm text-slate-600">
          {[
            { label: "Raw Materials", value: "₹7,20,000", percent: 60 },
            { label: "Finished Goods", value: "₹4,10,000", percent: 34 },
            { label: "Others", value: "₹1,10,000", percent: 9 },
          ].map((item) => (
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
      <Section title="Today's activities">
        <List
          items={[
            "GRN received from Steel Traders (₹35,000)",
            "Issued bearings to Service Dept (WO-140)",
            "Received 20 lubrication cans from Vendor",
          ]}
        />
      </Section>
      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Create GRN",
            "+ Issue Material",
            "+ Add Stock",
            "+ Record Damage",
          ]}
        />
      </Section>
    </div>
  );
}

function PurchaseManagerDashboard({ profileName }: DashboardProps) {
  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "Open PRs", value: "12" },
          { label: "POs Pending Approval", value: "4" },
          { label: "GRNs Pending", value: "3" },
          { label: "Monthly Purchase Value", value: "₹4,20,000" },
        ]}
      />
      <Section
        title="Purchase overview"
        subtitle={`Spend split for ${profileName}`}
      >
        <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-600">
          {[
            { label: "Electrical", value: "₹1,60,000" },
            { label: "Mechanical", value: "₹1,10,000" },
            { label: "Consumables", value: "₹90,000" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
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
      <Section title="Today's tasks">
        <List
          items={[
            "Approve PO-221 (Fasteners Ltd – ₹18,000)",
            "Create PO for Steel Rod (PR-112)",
            "Follow-up GRN from Lubricant Supplier",
          ]}
        />
      </Section>
      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Create PO",
            "+ Add Vendor",
            "+ Review PR",
            "+ Price Comparison",
          ]}
        />
      </Section>
    </div>
  );
}

function ServiceCoordinatorDashboard({ profileName }: DashboardProps) {
  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "New Complaints Today", value: "5" },
          { label: "Jobs Assigned", value: "12" },
          { label: "Pending Jobs", value: "7" },
          { label: "Completed Today", value: "4" },
        ]}
      />
      <Section
        title="Service pipeline"
        subtitle={`Pipeline health for ${profileName}`}
      >
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-4">
          {[
            { stage: "Logged", value: 10 },
            { stage: "Assigned", value: 12 },
            { stage: "In Progress", value: 8 },
            { stage: "Completed", value: 4 },
          ].map((item) => (
            <div key={item.stage} className="text-center">
              <div className="mx-auto mb-2 h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-300 p-6 text-2xl font-semibold text-indigo-600 shadow-inner shadow-white">
                {item.value}
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {item.stage}
              </p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Today's priority tasks">
        <List
          items={[
            "Assign job for motor overheating (Kumar Industries)",
            "Follow-up with Aravind on T-298",
            "Schedule visit for conveyor fault at Sri Plastics",
          ]}
        />
      </Section>
      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Log Complaint",
            "+ Assign Engineer",
            "+ Schedule Visit",
            "+ Update Status",
          ]}
        />
      </Section>
    </div>
  );
}

function SalesCoordinatorDashboard({ profileName }: DashboardProps) {
  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "New Leads Today", value: "12" },
          { label: "Quotations Pending", value: "8" },
          { label: "Follow-ups Today", value: "6" },
          { label: "Orders Closed", value: "4" },
        ]}
      />
      <Section
        title="Lead pipeline summary"
        subtitle={`Focus areas for ${profileName}`}
      >
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-5">
          {[
            { stage: "New", value: 12, gradient: "from-indigo-100 to-indigo-300" },
            { stage: "Contacted", value: 20, gradient: "from-sky-100 to-sky-300" },
            { stage: "Quotation Sent", value: 8, gradient: "from-amber-100 to-amber-300" },
            { stage: "Negotiation", value: 6, gradient: "from-purple-100 to-purple-300" },
            { stage: "Closed", value: 4, gradient: "from-emerald-100 to-emerald-300" },
          ].map((item) => (
            <div key={item.stage} className="text-center">
              <div
                className={`mx-auto mb-2 h-16 w-16 rounded-2xl bg-gradient-to-br ${item.gradient} p-5 text-xl font-semibold text-slate-800 shadow-inner shadow-white`}
              >
                {item.value}
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {item.stage}
              </p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Today's task list">
        <List
          items={[
            "Assign 3 new leads to sales team",
            "Prepare quotation for Sri Plastics",
            "Follow-up pending quotation Q-142",
            "Send product catalogue to Star Metals",
          ]}
        />
      </Section>
      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Add Lead",
            "+ Create Quotation",
            "+ Assign Lead",
            "+ Send Follow-up",
          ]}
        />
      </Section>
    </div>
  );
}

function AccountantDashboard({ profileName }: DashboardProps) {
  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "Total Receivables", value: "₹4,80,000" },
          { label: "Total Payables", value: "₹2,40,000" },
          { label: "GST Collected", value: "₹86,400" },
          { label: "GST Payable", value: "₹48,720" },
        ]}
      />
      <Section
        title="Cash flow summary"
        subtitle={`Daily overview for ${profileName}`}
      >
        <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
              Daily inflow
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">
              ₹1,20,000
            </p>
            <p className="text-xs text-emerald-600">+8% vs last week</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-600">
              Daily outflow
            </p>
            <p className="mt-2 text-2xl font-semibold text-rose-700">
              ₹45,000
            </p>
            <p className="text-xs text-rose-600">-3% vs last week</p>
          </div>
        </div>
      </Section>
      <Section title="Pending tasks">
        <List
          items={[
            "4 invoices due today",
            "2 vendor bills pending approval",
            "GST filing due in 5 days",
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
          ]}
        />
      </Section>
    </div>
  );
}

function ServiceEngineerDashboard({ profileName }: DashboardProps) {
  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "Jobs Assigned", value: "6" },
          { label: "Completed Today", value: "2" },
          { label: "Pending Jobs", value: "3" },
          { label: "Escalations", value: "0" },
        ]}
      />
      <Section
        title="Today's visit schedule"
        subtitle={`Field plan for ${profileName}`}
      >
        <List
          items={[
            "10:00 AM – Kumar Industries – Motor Overheat (High)",
            "1:00 PM – Star Metals – Alignment Issue (Medium)",
            "4:00 PM – Sri Plastics – Belt Trouble (Low)",
          ]}
        />
      </Section>
      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Start Job",
            "+ Upload Photo",
            "+ Add Spare Usage",
            "+ Close Job",
          ]}
        />
      </Section>
    </div>
  );
}

function SalesExecutiveDashboard({ profileName }: DashboardProps) {
  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "Leads Assigned", value: "14" },
          { label: "Follow-ups", value: "9" },
          { label: "Orders Won", value: "3" },
          { label: "Pipeline Value", value: "₹2,35,000" },
        ]}
      />
      <Section
        title="Sales funnel"
        subtitle={`Live funnel for ${profileName}`}
      >
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-4">
          {[
            { stage: "New Leads", value: 22, color: "from-indigo-100 to-indigo-300" },
            { stage: "Contacted", value: 18, color: "from-purple-100 to-purple-300" },
            { stage: "Quote Sent", value: 10, color: "from-amber-100 to-amber-300" },
            { stage: "Won", value: 3, color: "from-emerald-100 to-emerald-300" },
          ].map((item) => (
            <div key={item.stage} className="text-center">
              <div
                className={`mx-auto mb-2 h-16 w-16 rounded-full bg-gradient-to-br ${item.color} p-5 text-xl font-semibold text-slate-700 shadow-inner shadow-white`}
              >
                {item.value}
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {item.stage}
              </p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Quick actions">
        <QuickActions
          actions={["+ Add Lead", "+ Add Quotation", "+ Log Activity"]}
        />
      </Section>
    </div>
  );
}

function ServiceManagerDashboard({ profileName }: DashboardProps) {
  return (
    <div className="space-y-6">
      <Section
        title="Service status overview"
        subtitle={`Snapshot for ${profileName}`}
      >
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-4">
          {[
            { label: "Pending", value: "8", color: "bg-rose-100 text-rose-600" },
            { label: "In Progress", value: "5", color: "bg-amber-100 text-amber-600" },
            {
              label: "Completed Today",
              value: "4",
              color: "bg-emerald-100 text-emerald-600",
            },
            {
              label: "Escalated",
              value: "1",
              color: "bg-indigo-100 text-indigo-600",
            },
          ].map((status) => (
            <div
              key={status.label}
              className={`rounded-2xl border border-slate-100 px-4 py-4 text-center ${status.color}`}
            >
              <p className="text-xs uppercase tracking-[0.3em]">
                {status.label}
              </p>
              <p className="mt-2 text-2xl font-semibold">{status.value}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Today's scheduled visits">
        <List
          items={[
            "08:30 AM – Arora Foods – Dryer vibration",
            "12:00 PM – North Mills – Camera calibration",
            "03:30 PM – Summit Agro – Belt replacement",
          ]}
        />
      </Section>
      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Create Work Order",
            "+ Add Complaint",
            "+ Assign Technician",
          ]}
        />
      </Section>
    </div>
  );
}
