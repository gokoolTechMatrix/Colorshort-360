"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type LeadStage =
  | "New"
  | "In Discussion"
  | "Pending Approval"
  | "Approved"
  | "Won"
  | "Lost"
  | "Contacted"
  | "Quotation Sent"
  | "Ticket Created"
  | "Assigned"
  | "On the Way"
  | "Work Started"
  | "Spare Required"
  | "On Hold"
  | "Work Completed"
  | "Awaiting Approval"
  | "Closed";

type LeadTemperature = "Hot" | "Warm" | "Cold";

type Lead = {
  id: string;
  customer: string;
  company: string;
  owner: string;
  role: string;
  zone: string;
  state: string;
  product: string;
  source: string;
  stage: LeadStage;
  temperature: LeadTemperature;
  value?: string;
  nextAction?: string;
  nextAt?: string;
  statusTag?: string;
  special?: boolean;
};

type RoleCaps = {
  canAssign: boolean;
  canApproveQuotation: boolean;
  canRequestQuotation: boolean;
  canClose: boolean;
  canChangeStage: boolean;
  canCreate: boolean;
  readOnly: boolean;
  deny?: boolean;
  viewFilter: (lead: Lead, profileName?: string) => boolean;
};

const roleCaps: Record<string, RoleCaps> = {
  super_admin: {
    canAssign: true,
    canApproveQuotation: true,
    canRequestQuotation: true,
    canClose: true,
    canChangeStage: true,
    canCreate: true,
    readOnly: false,
    viewFilter: () => true,
  },
  finance: {
    canAssign: false,
    canApproveQuotation: false,
    canRequestQuotation: false,
    canClose: false,
    canChangeStage: false,
    canCreate: false,
    readOnly: true,
    viewFilter: (lead) => lead.stage === "Won" || !!lead.special,
  },
  accountant: {
    canAssign: false,
    canApproveQuotation: false,
    canRequestQuotation: false,
    canClose: false,
    canChangeStage: false,
    canCreate: false,
    readOnly: true,
    viewFilter: (lead) => lead.stage === "Won" || !!lead.special,
  },
  admin: {
    canAssign: true,
    canApproveQuotation: true,
    canRequestQuotation: true,
    canClose: true,
    canChangeStage: true,
    canCreate: true,
    readOnly: false,
    viewFilter: () => true,
  },
  "sales-manager": {
    canAssign: true,
    canApproveQuotation: true,
    canRequestQuotation: false,
    canClose: true,
    canChangeStage: true,
    canCreate: true,
    readOnly: false,
    viewFilter: () => true,
  },
  "sales-co-ordinator": {
    canAssign: true,
    canApproveQuotation: false,
    canRequestQuotation: false,
    canClose: false,
    canChangeStage: false,
    canCreate: true,
    readOnly: false,
    viewFilter: (lead) =>
      lead.stage === "New" || lead.stage === "In Discussion" || lead.stage === "Pending Approval",
  },
  "sales-executive": {
    canAssign: false,
    canApproveQuotation: false,
    canRequestQuotation: true,
    canClose: true,
    canChangeStage: false,
    canCreate: true,
    readOnly: false,
    viewFilter: (lead, profileName) =>
      lead.role === "sales-executive" &&
      lead.owner.toLowerCase().includes((profileName ?? "").toLowerCase()),
  },
  "service-manager": {
    canAssign: true,
    canApproveQuotation: true,
    canRequestQuotation: true,
    canClose: true,
    canChangeStage: true,
    canCreate: false,
    readOnly: false,
    viewFilter: (lead) => lead.role?.startsWith("service"),
  },
  "service-co-ordinator": {
    canAssign: false,
    canApproveQuotation: false,
    canRequestQuotation: true,
    canClose: false,
    canChangeStage: true,
    canCreate: true,
    readOnly: false,
    viewFilter: (lead) => lead.role?.startsWith("service"),
  },
  "service-executive": {
    canAssign: false,
    canApproveQuotation: false,
    canRequestQuotation: true,
    canClose: false,
    canChangeStage: true,
    canCreate: false,
    readOnly: false,
    viewFilter: (lead, profileName) =>
      lead.role?.startsWith("service") &&
      lead.owner.toLowerCase().includes((profileName ?? "").toLowerCase()),
  },
  "service-engineer": {
    canAssign: false,
    canApproveQuotation: false,
    canRequestQuotation: true,
    canClose: false,
    canChangeStage: true,
    canCreate: false,
    readOnly: false,
    viewFilter: (lead, profileName) =>
      lead.role?.startsWith("service") &&
      lead.owner.toLowerCase().includes((profileName ?? "").toLowerCase()),
  },
  hr: {
    canAssign: false,
    canApproveQuotation: false,
    canRequestQuotation: false,
    canClose: false,
    canChangeStage: false,
    canCreate: false,
    readOnly: true,
    deny: true,
    viewFilter: () => false,
  },
};

const mockLeads: Lead[] = [
  {
    id: "L-1023",
    customer: "Arun Kumar",
    company: "Delta Agro Mills",
    owner: "Myura",
    role: "sales-executive",
    zone: "South",
    state: "Tamil Nadu",
    product: "Rice Sorter",
    source: "Inbound Call",
    stage: "In Discussion",
    temperature: "Hot",
    value: "Rs 118.5L",
    nextAction: "Schedule on-site demo",
    nextAt: "2025-11-30 11:00",
    special: true,
  },
  {
    id: "L-1041",
    customer: "Sangeetha",
    company: "Prime Cereals",
    owner: "Gokul",
    role: "service-engineer",
    zone: "West",
    state: "Maharashtra",
    product: "Colour Sorter",
    source: "Web Form",
    stage: "Assigned",
    temperature: "Warm",
    value: "Rs 112.0L",
    nextAction: "Initial qualification call",
    nextAt: "2025-11-27 15:00",
  },
  {
    id: "L-1088",
    customer: "Vishnu",
    company: "Harvest Pro",
    owner: "Naveen",
    role: "sales-executive",
    zone: "North",
    state: "Delhi",
    product: "Wheat Sorter",
    source: "Expo Lead",
    stage: "Pending Approval",
    temperature: "Hot",
    value: "Rs 125.0L",
    nextAction: "Manager approval for quotation",
    nextAt: "2025-11-26 10:30",
  },
  {
    id: "L-1102",
    customer: "Priya R",
    company: "Shree Pulses",
    owner: "Service Coordinator",
    role: "service-co-ordinator",
    zone: "South",
    state: "Karnataka",
    product: "Pulse Sorter",
    source: "Portal",
    stage: "Ticket Created",
    temperature: "Warm",
    value: "Rs 19.8L",
    nextAction: "Send final quotation",
    nextAt: "2025-11-26 16:00",
  },
  {
    id: "L-1120",
    customer: "Mohan",
    company: "Agro Prime",
    owner: "Service Manager",
    role: "service-manager",
    zone: "East",
    state: "Odisha",
    product: "Combo Sorter",
    source: "Referral",
    stage: "Assigned",
    temperature: "Hot",
    value: "Rs 130.0L",
    nextAction: "Plan installation scope",
    nextAt: "2025-11-29 12:00",
  },
  {
    id: "L-1155",
    customer: "Karthik",
    company: "Bright Mills",
    owner: "Sales Coordinator",
    role: "sales-co-ordinator",
    zone: "South",
    state: "Tamil Nadu",
    product: "Rice Sorter",
    source: "Inbound Call",
    stage: "New",
    temperature: "Cold",
    value: "Rs 16.0L",
    nextAction: "Verify contact & commodity",
    nextAt: "2025-11-28 09:30",
  },
  {
    id: "L-1189",
    customer: "Sanjay",
    company: "Harvest Hub",
    owner: "Sales Manager",
    role: "sales-manager",
    zone: "West",
    state: "Goa",
    product: "Cashew Sorter",
    source: "Email",
    stage: "In Discussion",
    temperature: "Warm",
    value: "Rs 114.2L",
    nextAction: "Review demo notes",
    nextAt: "2025-11-27 17:00",
  },
  {
    id: "L-1201",
    customer: "Divya",
    company: "PulseWorks",
    owner: "HR",
    role: "hr",
    zone: "North",
    state: "Punjab",
    product: "Pulse Sorter",
    source: "Portal",
    stage: "Won",
    temperature: "Cold",
    value: "Rs 121.0L",
    nextAction: "Invoice & payment plan",
    nextAt: "2025-11-30 12:00",
    special: true,
  },
  {
    id: "L-1222",
    customer: "Finance Lead",
    company: "Growth Mills",
    owner: "Accountant",
    role: "finance",
    zone: "South",
    state: "Kerala",
    product: "Combo Sorter",
    source: "Order",
    stage: "Won",
    temperature: "Warm",
    value: "Rs 132.5L",
    nextAction: "Generate invoice & push to Tally",
    nextAt: "2025-11-28 14:00",
  },
];

const salesStageOrder: LeadStage[] = [
  "New",
  "In Discussion",
  "Pending Approval",
  "Approved",
  "Won",
  "Lost",
];

const serviceStageOrder: LeadStage[] = [
  "Ticket Created",
  "Assigned",
  "On the Way",
  "Work Started",
  "Spare Required",
  "On Hold",
  "Work Completed",
  "Awaiting Approval",
  "Closed",
];

type SupabaseLeadRow = {
  id: number;
  customer_name?: string | null;
  contact_person?: string | null;
  state?: string | null;
  purpose_switch?: string | null;
  status?: string | null;
  hot_cold_flag?: string | null;
  lead_source_?: string | null;
  next_followup_on?: string | null;
};

const mapSupabaseLead = (lead: SupabaseLeadRow): Lead => {
  const stageFromStatus = (status?: string | null): LeadStage => {
    const normalized = (status ?? "").toLowerCase();
    if (normalized.includes("won")) return "Won";
    if (normalized.includes("lost")) return "Lost";
    if (normalized.includes("approve")) return "Pending Approval";
    if (normalized.includes("discussion")) return "In Discussion";
    if (normalized.includes("approved")) return "Approved";
    return "New";
  };
  const temperatureFromFlag = (flag?: string | null): LeadTemperature => {
    const normalized = (flag ?? "").toLowerCase();
    if (normalized === "hot") return "Hot";
    if (normalized === "cold") return "Cold";
    return "Warm";
  };
  const stage = stageFromStatus(lead.status);
  const temperature = temperatureFromFlag(lead.hot_cold_flag);
  return {
    id: `SUP-${lead.id}`,
    customer: lead.contact_person || lead.customer_name || "Customer",
    company: lead.customer_name || "Company",
    owner: "Unassigned",
    role: "sales-executive",
    zone: lead.state || "Zone",
    state: lead.state || "State",
    product: lead.purpose_switch || "Lead",
    source: lead.lead_source_ || "App",
    stage,
    temperature,
    value: "Rs 0",
    nextAction: lead.purpose_switch ? `Discuss: ${lead.purpose_switch}` : "Follow up",
    nextAt: lead.next_followup_on
      ? lead.next_followup_on
      : new Date().toISOString().slice(0, 10),
  };
};

const kpiStyles = [
  { border: "border-cyan-100", bg: "bg-cyan-50", accent: "text-cyan-600" },
  { border: "border-indigo-100", bg: "bg-indigo-50", accent: "text-indigo-600" },
  { border: "border-amber-100", bg: "bg-amber-50", accent: "text-amber-600" },
  { border: "border-emerald-100", bg: "bg-emerald-50", accent: "text-emerald-600" },
];

const quotationKpis = [
  { label: "Submitted", value: "12", color: "bg-blue-50" },
  { label: "PO received", value: "3", color: "bg-emerald-50" },
  { label: "Pending review", value: "4", color: "bg-amber-50" },
  { label: "Invoices", value: "5", color: "bg-slate-50" },
];

const quotations = [
  {
    id: "Q-2025-729",
    status: "PO RECEIVED",
    company: "Matrix Smart",
    client: "Matrix Smart",
    leadId: "251111",
    date: "21/11/2025",
    price: "Rs 111.8L",
  },
  {
    id: "Q-2025-771",
    status: "SUBMITTED",
    company: "ABC COMPANY",
    client: "ABC COMPANY",
    leadId: "251110",
    date: "21/11/2025",
    price: "Rs 13.98L",
  },
  {
    id: "Q-2025-668",
    status: "SUBMITTED",
    company: "ABC COMPANY",
    client: "ABC COMPANY",
    leadId: "251109",
    date: "21/11/2025",
    price: "Rs 10.0L",
  },
];

export default function LeadManagementPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const companyLogo = "/image.png";
  const [profileRole, setProfileRole] = useState<string>("sales-executive");
  const profileName = "Team Member";
  const [selectedStage, setSelectedStage] = useState<LeadStage | "All">("All");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [toast, setToast] = useState<string | null>(null);
  const [isRefreshingLeads, setIsRefreshingLeads] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [selectedTab, setSelectedTab] = useState<"overview" | "quotations" | "orders">(
    "overview",
  );
  const allowedRole = "sales-executive";

  const caps = roleCaps[profileRole] ?? roleCaps["super_admin"];
  const isServiceRole = profileRole.startsWith("service");
  const activeStageOrder = isServiceRole ? serviceStageOrder : salesStageOrder;

  const visibleLeads = useMemo(
    () => leads.filter((lead) => caps.viewFilter(lead, profileName)),
    [caps, leads, profileName],
  );

  const filteredLeads = useMemo(() => {
    if (selectedStage === "All") return visibleLeads;
    return visibleLeads.filter((lead) => lead.stage === selectedStage);
  }, [selectedStage, visibleLeads]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  useEffect(() => {
    const detectRole = () => {
      if (typeof window === "undefined") return allowedRole;
      const stored =
        window.localStorage.getItem("role_slug") ||
        window.localStorage.getItem("role") ||
        window.sessionStorage.getItem("role_slug") ||
        "";
      const normalized = stored?.toLowerCase().replace(/[^a-z0-9-]/g, "") || "";
      return normalized || allowedRole;
    };
    const role = detectRole();
    setProfileRole(role);
  }, [allowedRole]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const fetchSupabaseLeads = async () => {
      try {
        const response = await fetch("/api/leads", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { leads?: SupabaseLeadRow[] };
        const mapped = (payload.leads ?? []).map(mapSupabaseLead);
        setLeads((prev) => [...mapped, ...prev]);
      } catch {
        // ignore best-effort fetch
      }
    };
    void fetchSupabaseLeads();
  }, []);

  useEffect(() => {
    if (selectedStage !== "All" && !activeStageOrder.includes(selectedStage as LeadStage)) {
      setSelectedStage("All");
    }
  }, [activeStageOrder, selectedStage]);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  };

  const handleRefreshLeads = async () => {
    if (isRefreshingLeads) return;
    setIsRefreshingLeads(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setLeads([...mockLeads]);
      setToast("Leads refreshed");
    } finally {
      setIsRefreshingLeads(false);
    }
  };

  const handleStageChange = (leadId: string, stage: LeadStage) => {
    if (
      !caps.canChangeStage &&
      !caps.canApproveQuotation &&
      !caps.canRequestQuotation &&
      !caps.canClose
    ) {
      return;
    }
    setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)));
    setToast(`Lead ${leadId} moved to ${stage}`);
  };

  const handleNeedInfo = (leadId: string) => {
    handleStageChange(leadId, "In Discussion");
    setToast(`Requested more info for ${leadId}`);
  };

  const handleRejectLead = (leadId: string) => {
    handleStageChange(leadId, "Lost");
    setToast(`Lead ${leadId} marked as lost`);
  };

  const handleNewLead = () => {
    const nextId = `L-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newLead: Lead = {
      id: nextId,
      customer: "New Prospect",
      company: "Assigned Company",
      owner: profileName,
      role: profileRole,
      zone: "North",
      state: "Delhi",
      product: "Not set",
      source: "Manual",
      stage: "New",
      temperature: "Warm",
      statusTag: "Assigned",
      nextAction: "Intro call",
      nextAt: new Date().toISOString().slice(0, 10),
    };
    setLeads((prev) => [newLead, ...prev]);
    setSelectedLeadId(newLead.id);
    setToast("New lead received");
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setToast(`Opening ${leadId}`);
  };

  const handleNextAction = () => {
    if (!selectedLead) return;
    const order = activeStageOrder;
    const currentIndex = order.indexOf(selectedLead.stage);
    const nextStage =
      currentIndex >= 0 && currentIndex < order.length - 1
        ? order[currentIndex + 1]
        : selectedLead.stage;
    handleStageChange(selectedLead.id, nextStage);
    setToast("Next action logged");
  };

  const handleSaveFollowUp = () => {
    if (!selectedLead) return;
    const datePart = followUpDate || selectedLead.nextAt?.split("T")[0] || "";
    const timePart = followUpTime || "09:00";
    const nextAt = `${datePart} ${timePart}`;
    setLeads((prev) =>
      prev.map((lead) => (lead.id === selectedLead.id ? { ...lead, nextAt } : lead)),
    );
    setToast("Follow-up saved");
  };

  const parseNextAt = (value?: string) => {
    if (!value) return new Date(NaN);
    return new Date(value.replace(" ", "T"));
  };

  const now = Date.now();
  const pendingApprovals = filteredLeads.filter((lead) => lead.stage === "Pending Approval");
  const atRiskLeads = filteredLeads.filter((lead) => {
    const nextDate = parseNextAt(lead.nextAt);
    if (Number.isNaN(nextDate.getTime())) return false;
    const diffDays = (now - nextDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 2;
  });
  const overdueFollowups = filteredLeads.filter((lead) => {
    const nextDate = parseNextAt(lead.nextAt);
    return !Number.isNaN(nextDate.getTime()) && nextDate.getTime() < now;
  });
  const hotLeads = filteredLeads.filter((lead) => lead.temperature === "Hot");

  const kpis = [
    { label: "Team Pipeline", value: "Rs 3.8 Cr", subLabel: `${filteredLeads.length} active deals` },
    { label: "Pending approvals", value: pendingApprovals.length, subLabel: "Needs manager decision" },
    { label: "At-risk & overdue", value: atRiskLeads.length, subLabel: `${overdueFollowups.length} follow-ups overdue` },
    { label: "Hot leads", value: hotLeads.length, subLabel: "Prioritize demos & quotes" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        companyLogo={companyLogo}
        onLogout={handleLogout}
        isSigningOut={isSigningOut}
        activeHref="/lead-management"
        showSettings={profileRole === "super_admin"}
        showUserCreation={profileRole === "super_admin"}
        showLeadManagement
        showCustomerVendorManagement={profileRole === "admin" || profileRole === "super_admin"}
      />

      <main className="flex-1 px-4 py-6 sm:px-8">
        <header className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-r from-[#2f7bff] via-[#149dff] to-[#05c6c8] p-6 text-white shadow-[0_25px_55px_rgba(20,157,255,0.35)]">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute left-1/3 top-4 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Sales Command</p>
              <h1 className="mt-1 text-3xl font-semibold leading-tight">
                {profileName}, keep momentum on live deals.
              </h1>
              <p className="text-sm text-white/85">Track funnel health, follow-ups, and top opportunities.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {[
                { label: "Leads today", value: "12" },
                { label: "Win rate", value: "28%" },
                { label: "Follow-ups pending", value: "7" },
              ].map((pill) => (
                <span
                  key={pill.label}
                  className="rounded-full bg-white/20 px-3 py-2 text-white shadow-inner shadow-cyan-200/40 backdrop-blur"
                >
                  {pill.label}: {pill.value}
                </span>
              ))}
              <div className="flex gap-2">
                {["overview", "quotations", "orders"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab as typeof selectedTab)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${
                      selectedTab === tab
                        ? "bg-white text-cyan-700"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!isServiceRole && (
                <>
                  <button
                    className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/25 disabled:opacity-60"
                    onClick={handleRefreshLeads}
                    aria-label="Refresh leads"
                    disabled={isRefreshingLeads}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 text-white ${isRefreshingLeads ? "animate-spin" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M4 4v6h6M20 20v-6h-6" />
                      <path d="M5 13a7 7 0 0 0 12 3M19 11A7 7 0 0 0 7.05 8.05" />
                    </svg>
                    Refresh
                  </button>
                  {caps.canCreate && (
                    <button
                      onClick={handleNewLead}
                      className="rounded-full border border-white/70 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
                    >
                      + New Lead
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {selectedTab === "overview" && (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              {kpis.map((kpi, index) => {
                const palette = kpiStyles[index % kpiStyles.length];
                return (
                  <div
                    key={kpi.label}
                    className={`relative overflow-hidden rounded-3xl border ${palette.border} ${palette.bg} p-4 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${palette.accent}`}>
                      {kpi.label}
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-slate-900">{kpi.value}</div>
                    {kpi.subLabel && (
                      <div className="mt-1 text-xs font-semibold text-slate-600">{kpi.subLabel}</div>
                    )}
                  </div>
                );
              })}
            </section>

            <section className="mt-6">
              <div className="rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-lg shadow-indigo-100/60">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Approval queue</p>
                    <p className="text-sm font-semibold text-slate-600">
                      {pendingApprovals.length} waiting for manager decision
                    </p>
                  </div>
                  {caps.canApproveQuotation && (
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Needs review</span>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                        Approve / Reject / Info
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {pendingApprovals.length === 0 && (
                    <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm font-semibold text-slate-500">
                      No approvals pending. You are clear for now.
                    </div>
                  )}
                  {pendingApprovals.map((lead) => (
                    <div
                      key={lead.id}
                      className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {lead.customer} <span className="text-xs text-slate-500">({lead.id})</span>
                          </p>
                          <p className="text-xs text-slate-500">{lead.company}</p>
                        </div>
                        <span className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-indigo-700">
                          {lead.value}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                        <span className="rounded-full bg-white px-2 py-1 text-slate-600">{lead.product}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{lead.owner}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-white ${
                            lead.temperature === "Hot"
                              ? "bg-rose-500"
                              : lead.temperature === "Warm"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                          }`}
                        >
                          {lead.temperature}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-600">
                        Next: {lead.nextAction} → {lead.nextAt}
                      </p>
                      {caps.canApproveQuotation && (
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                          <button
                            className="rounded-full bg-emerald-500 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                            onClick={() => handleStageChange(lead.id, "Approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-full bg-amber-500 px-3 py-1.5 text-white shadow-sm shadow-amber-200 transition hover:bg-amber-400"
                            onClick={() => handleNeedInfo(lead.id)}
                          >
                            Need Info
                          </button>
                          <button
                            className="rounded-full bg-rose-500 px-3 py-1.5 text-white shadow-sm shadow-rose-200 transition hover:bg-rose-400"
                            onClick={() => handleRejectLead(lead.id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">My Leads</p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/sales-co-ordinator/add-lead/new")}
                    className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-400"
                  >
                    Add Lead
                  </button>
                </div>

                <div className="space-y-3">
                  {filteredLeads.map((lead) => {
                    const displayName = lead.customer || lead.owner;
                    const initial = displayName.charAt(0).toUpperCase();
                    return (
                      <button
                        key={lead.id}
                        onClick={() => handleSelectLead(lead.id)}
                        className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                              {initial}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                              <p className="text-xs text-slate-500">Lead ID: {lead.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                              {lead.product}
                            </span>
                            {lead.statusTag && (
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600">
                                {lead.statusTag}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{lead.nextAction}</span>
                          <span className="text-xs text-slate-500">Next Action</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
                  <p className="text-sm font-semibold text-slate-800">Pending Approvals</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {pendingApprovals.length ? `${pendingApprovals.length} awaiting decision` : "No pending approvals."}
                  </p>
                </div>
                {selectedLead && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">Selected Lead</p>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                        {selectedLead.stage}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedLead.customer} · {selectedLead.id}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">Next: {selectedLead.nextAction}</p>
                    <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600">
                      <label className="space-y-1">
                        <span>Date</span>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm shadow-inner focus:border-cyan-300 focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1">
                        <span>Time</span>
                        <input
                          type="time"
                          value={followUpTime}
                          onChange={(e) => setFollowUpTime(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm shadow-inner focus:border-cyan-300 focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1">
                        <span>Notes</span>
                        <textarea
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm shadow-inner focus:border-cyan-300 focus:outline-none"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <button
                        onClick={handleNextAction}
                        className="rounded-full bg-blue-500 px-3 py-1.5 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-400"
                      >
                        Next action
                      </button>
                      <button
                        onClick={handleSaveFollowUp}
                        className="rounded-full bg-cyan-500 px-3 py-1.5 text-white shadow-sm shadow-cyan-200 transition hover:bg-cyan-400"
                      >
                        Save follow-up
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {selectedTab === "quotations" && (
          <>
            <section className="mb-4 grid gap-3 sm:grid-cols-4">
              {quotationKpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`rounded-2xl border border-white/60 ${kpi.color} p-4 shadow-md shadow-slate-100`}
                >
                  <p className="text-xs font-semibold text-slate-700">{kpi.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{kpi.value}</p>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              {quotations.map((quote) => (
                <div
                  key={quote.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{quote.id}</p>
                      <p className="text-xs text-slate-500">
                        Company: {quote.company} · Client: {quote.client} · Lead ID: {quote.leadId} · Date: {quote.date}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600">
                      {quote.status}
                    </span>
                    <p className="text-lg font-semibold text-slate-900">{quote.price}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                    <button className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 shadow-inner transition hover:bg-slate-200">
                      Preview Invoice
                    </button>
                    <button className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 shadow-inner transition hover:bg-slate-200">
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {selectedTab === "orders" && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
            Orders view coming soon.
          </div>
        )}
      </main>

      {toast && <LeadToast message={toast} />}
    </div>
  );
}

function LeadToast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center">
      <div
        className="mt-10 rounded-3xl bg-gradient-to-r from-cyan-200 via-cyan-300 to-sky-300 px-6 py-4 text-sm font-semibold text-slate-900 shadow-[0_15px_40px_rgba(14,165,233,0.35)] backdrop-blur"
        style={{
          animation: "toastPop 220ms ease, toastFade 320ms ease 2.7s forwards",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-base font-bold text-cyan-700 shadow-inner shadow-cyan-100">
            !
          </span>
          <p className="text-base font-semibold leading-snug">{message}</p>
        </div>
      </div>
    </div>
  );
}
