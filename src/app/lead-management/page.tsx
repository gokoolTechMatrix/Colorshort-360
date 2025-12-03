"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getRoleFromEmail } from "@/lib/role-map";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type LeadStage =
  | "New"
  | "In Discussion"
  | "Pending Approval"
  | "Approved"
  | "Won"
  | "Lost"
  // Service workflow
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
  value: string;
  nextAction: string;
  nextAt: string;
  special?: boolean;
};

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@qube.com";

type RoleCaps = {
  canAssign: boolean;
  canApproveQuotation: boolean;
  canRequestQuotation: boolean;
  canClose: boolean;
  canChangeStage: boolean;
  canCreate: boolean;
  readOnly: boolean;
  viewFilter: (lead: Lead, profileName: string) => boolean;
  deny?: boolean;
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
      lead.owner.toLowerCase().includes(profileName.toLowerCase()),
  },
  "service-manager": {
    canAssign: true, // final assignment authority
    canApproveQuotation: true, // approvals for charges/spares/closure
    canRequestQuotation: true, // can push requests forward
    canClose: true, // final closure
    canChangeStage: true,
    canCreate: false, // coordinator creates tickets
    readOnly: false,
    viewFilter: (lead) => lead.role?.startsWith("service"),
  },
  "service-co-ordinator": {
    canAssign: false, // manager assigns
    canApproveQuotation: false,
    canRequestQuotation: true, // can push to approval queue
    canClose: false,
    canChangeStage: true, // can update status progression
    canCreate: true, // only role that creates service tickets
    readOnly: false,
    viewFilter: (lead) => lead.role?.startsWith("service"),
  },
  "service-executive": {
    canAssign: false,
    canApproveQuotation: false,
    canRequestQuotation: true, // request approvals/closures
    canClose: false,
    canChangeStage: true, // update job status
    canCreate: false,
    readOnly: false,
    viewFilter: (lead, profileName) =>
      lead.role?.startsWith("service") &&
      lead.owner.toLowerCase().includes(profileName.toLowerCase()),
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
      lead.owner.toLowerCase().includes(profileName.toLowerCase()),
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

const allowedRoles = new Set(Object.keys(roleCaps));

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
    value: "₹18.5L",
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
    value: "₹12.0L",
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
    value: "₹25.0L",
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
    value: "₹9.8L",
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
    value: "₹30.0L",
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
    value: "₹6.0L",
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
    value: "₹14.2L",
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
    value: "₹21.0L",
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
    value: "₹32.5L",
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
    value: "�,0",
    nextAction: lead.purpose_switch ? `Discuss: ${lead.purpose_switch}` : "Follow up",
    nextAt: lead.next_followup_on
      ? lead.next_followup_on
      : new Date().toISOString().slice(0, 10),
  };
};

export default function LeadManagementPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Team Member");
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");
  const [selectedStage, setSelectedStage] = useState<LeadStage | "All">("All");
  const [selectedTemp, setSelectedTemp] = useState<LeadTemperature | "All">(
    "All",
  );
  const [toast, setToast] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [isRefreshingLeads, setIsRefreshingLeads] = useState(false);
  const [serviceNotifications, setServiceNotifications] = useState<
    Array<{ id: string; message: string; time: string }>
  >([]);
  const isFinanceRole =
    profileRole === "finance" ||
    profileRole === "accountant" ||
    profileRole === "super_admin";
  const [payments, setPayments] = useState<
    Array<{ id: string; leadId: string; amount: string; mode: string; date: string }>
  >([
    { id: "P-1001", leadId: "L-1222", amount: "₹12.5L", mode: "NEFT", date: "2025-11-25" },
    { id: "P-1002", leadId: "L-1201", amount: "₹8.5L", mode: "UPI", date: "2025-11-24" },
  ]);
  const [credits, setCredits] = useState<
    Array<{ id: string; leadId: string; amount: string; date: string }>
  >([{ id: "CN-201", leadId: "L-1222", amount: "₹65,000", date: "2025-11-26" }]);
  const [debits, setDebits] = useState<
    Array<{ id: string; leadId: string; amount: string; date: string }>
  >([{ id: "DN-310", leadId: "L-1222", amount: "₹24,000", date: "2025-11-26" }]);

  const caps = roleCaps[profileRole ?? ""] ?? roleCaps["super_admin"];
  const isServiceRole = (profileRole ?? "").startsWith("service");
  const activeStageOrder = isServiceRole ? serviceStageOrder : salesStageOrder;

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
      const derivedRole =
        (user.user_metadata?.role as string | undefined)?.toLowerCase() ??
        getRoleFromEmail(user.email)?.toLowerCase() ??
        "";
      const slug = derivedRole
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const isSuperAdmin =
        user.email?.toLowerCase() === SUPER_ADMIN_EMAIL || slug === "super_admin";
      if (!isSuperAdmin && !allowedRoles.has(slug)) {
        router.replace("/login");
        return;
      }
      setProfileRole(isSuperAdmin ? "super_admin" : slug);
      const derivedName =
        (user.user_metadata?.full_name as string | undefined) ?? "Team Member";
      setProfileName(derivedName);
      setIsCheckingAuth(false);
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
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (isCheckingAuth) return;
    const fetchSupabaseLeads = async () => {
      try {
        const response = await fetch("/api/leads", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { leads?: SupabaseLeadRow[] };
        const mapped = (payload.leads ?? []).map(mapSupabaseLead);
        setLeads([...mapped, ...mockLeads]);
      } catch {
        // best effort
      }
    };
    void fetchSupabaseLeads();
  }, [isCheckingAuth]);


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
      // Simulate fetch — replace with real API when available.
      await new Promise((resolve) => setTimeout(resolve, 600));
      setLeads([...mockLeads]);
      setToast("Leads refreshed");
    } finally {
      setIsRefreshingLeads(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Loading leads…
      </div>
    );
  }
  if (
    !profileRole ||
    (!allowedRoles.has(profileRole) && profileRole !== "super_admin") ||
    caps.deny
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-rose-500">
        Access denied for lead management.
      </div>
    );
  }

  const filteredLeads = leads.filter((lead) => {
    if (selectedStage !== "All" && lead.stage !== selectedStage) return false;
    if (selectedTemp !== "All" && lead.temperature !== selectedTemp) return false;
    return caps.viewFilter(lead, profileName);
  });

  const handleStageChange = (leadId: string, stage: LeadStage) => {
    if (!caps.canChangeStage && !caps.canApproveQuotation && !caps.canRequestQuotation && !caps.canClose) {
      return;
    }
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)),
    );
    if (isServiceRole && (profileRole === "service-engineer" || profileRole === "service-executive")) {
      setServiceNotifications((prev) => [
        ...prev.slice(-9),
        {
          id: `${leadId}-${stage}-${Date.now()}`,
          message: `${profileName} updated ${leadId} to ${stage}`,
          time: new Date().toLocaleString(),
        },
      ]);
    }
    setToast(`Lead ${leadId} moved to ${stage}`);
  };

  const handleAssign = (leadId: string, owner: string) => {
    if (!caps.canAssign) return;
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              owner,
              role: owner.toLowerCase().includes("service")
                ? "service-engineer"
                : lead.role,
              stage: isServiceRole ? "Assigned" : lead.stage,
            }
          : lead,
      ),
    );
    setToast(`Lead ${leadId} assigned to ${owner}`);
  };

  const handleRejectLead = (leadId: string) => {
    if (!caps.canApproveQuotation) return;
    handleStageChange(leadId, "In Discussion");
    setToast(`Lead ${leadId} sent back for revision`);
  };

  const handleNewLead = () => {
    const rawRole = profileRole || "sales-co-ordinator";
    const targetRole =
      rawRole
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "sales-co-ordinator";
    router.push(`/dashboard/${targetRole}/add-lead/new`);
  };

  const handleNeedInfo = (leadId: string) => {
    if (!caps.canApproveQuotation) return;
    setToast(`Requested more info for ${leadId}`);
  };

  const renderServiceActions = (lead: Lead): ReactNode => {
    if (!isServiceRole || caps.readOnly) return null;
    const actions: ReactNode[] = [];
    const addAction = (label: string, stage: LeadStage, className: string) => {
      if (!caps.canChangeStage && !caps.canRequestQuotation && !caps.canApproveQuotation && !caps.canClose) return;
      actions.push(
        <button
          key={`${lead.id}-${label}`}
          className={className}
          onClick={() => handleStageChange(lead.id, stage)}
        >
          {label}
        </button>,
      );
    };

    if (caps.canAssign) {
      actions.push(
        <button
          key={`${lead.id}-assign`}
          className="rounded-full bg-indigo-500 px-3 py-1.5 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
          onClick={() => handleAssign(lead.id, "Service Engineer")}
        >
          Assign Engineer
        </button>,
      );
    }

    switch (lead.stage) {
      case "Ticket Created":
      case "Assigned":
        addAction(
          "Mark On the Way",
          "On the Way",
          "rounded-full bg-cyan-500 px-3 py-1.5 text-white shadow-sm shadow-cyan-200 transition hover:bg-cyan-400",
        );
        break;
      case "On the Way":
        addAction(
          "Start Work",
          "Work Started",
          "rounded-full bg-emerald-500 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400",
        );
        break;
      case "Work Started":
        addAction(
          "Spare Required",
          "Spare Required",
          "rounded-full bg-amber-500 px-3 py-1.5 text-white shadow-sm shadow-amber-200 transition hover:bg-amber-400",
        );
        addAction(
          "On Hold",
          "On Hold",
          "rounded-full bg-slate-700 px-3 py-1.5 text-white shadow-sm shadow-slate-300 transition hover:bg-slate-600",
        );
        addAction(
          "Work Completed",
          "Work Completed",
          "rounded-full bg-emerald-600 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-500",
        );
        break;
      case "Spare Required":
      case "On Hold":
        addAction(
          "Resume Work",
          "Work Started",
          "rounded-full bg-blue-500 px-3 py-1.5 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-400",
        );
        addAction(
          "Work Completed",
          "Work Completed",
          "rounded-full bg-emerald-600 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-500",
        );
        break;
      case "Work Completed":
        addAction(
          "Request Approval",
          "Awaiting Approval",
          "rounded-full bg-purple-500 px-3 py-1.5 text-white shadow-sm shadow-purple-200 transition hover:bg-purple-400",
        );
        break;
      case "Awaiting Approval":
        if (caps.canClose || caps.canApproveQuotation) {
          addAction(
            "Approve & Close",
            "Closed",
            "rounded-full bg-emerald-600 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-500",
          );
          addAction(
            "Reopen Work",
            "Work Started",
            "rounded-full bg-rose-500 px-3 py-1.5 text-white shadow-sm shadow-rose-200 transition hover:bg-rose-400",
          );
        }
        break;
      default:
        break;
    }

    if (!actions.length) return null;
    return <div className="flex flex-wrap gap-2 text-xs font-semibold">{actions}</div>;
  };

  const handleFinanceAction = (leadId: string, action: string) => {
    if (!isFinanceRole) return;
    setToast(`${action} for ${leadId} ready`);
  };

  const addPayment = () => {
    if (!isFinanceRole) return;
    const nextId = `P-${Math.floor(Math.random() * 9000 + 1000)}`;
    setPayments((prev) => [
      { id: nextId, leadId: "L-1222", amount: "₹1.2L", mode: "Bank Transfer", date: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    setToast(`Payment recorded (${nextId})`);
  };

  const addCreditNote = () => {
    if (!isFinanceRole) return;
    const nextId = `CN-${Math.floor(Math.random() * 900 + 100)}`;
    setCredits((prev) => [
      { id: nextId, leadId: "L-1222", amount: "₹35,000", date: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    setToast(`Credit Note created (${nextId})`);
  };

  const addDebitNote = () => {
    if (!isFinanceRole) return;
    const nextId = `DN-${Math.floor(Math.random() * 900 + 100)}`;
    setDebits((prev) => [
      { id: nextId, leadId: "L-1222", amount: "₹18,000", date: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    setToast(`Debit Note created (${nextId})`);
  };

  const pipelineColumns = activeStageOrder.map((stage) => ({
    stage,
    items: filteredLeads.filter((lead) => lead.stage === stage),
  }));

  const parseNextAt = (value: string) => new Date(value.replace(" ", "T"));
  const now = Date.now();
  const pendingApprovals = filteredLeads.filter((lead) => lead.stage === "Pending Approval");
  const atRiskLeads = filteredLeads.filter((lead) => {
    const nextDate = parseNextAt(lead.nextAt);
    if (Number.isNaN(nextDate.getTime())) return false;
    const diffDays = (now - nextDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 2; // overdue by 2+ days
  });
  const overdueFollowups = filteredLeads.filter((lead) => {
    const nextDate = parseNextAt(lead.nextAt);
    return !Number.isNaN(nextDate.getTime()) && nextDate.getTime() < now;
  });
  const hotLeads = filteredLeads.filter((lead) => lead.temperature === "Hot");
  const showServiceUpdates = profileRole?.includes("sales-manager");

  const kpis = [
    { label: "Team Pipeline", value: "Rs 3.8 Cr", subLabel: `${filteredLeads.length} active deals` },
    { label: "Pending approvals", value: pendingApprovals.length, subLabel: "Needs manager decision" },
    { label: "At-risk & overdue", value: atRiskLeads.length, subLabel: `${overdueFollowups.length} follow-ups overdue` },
    { label: "Hot leads", value: hotLeads.length, subLabel: "Prioritize demos & quotes" },
  ];
  const kpiStyles = [
    { bg: "bg-sky-50", border: "border-sky-100", accent: "text-sky-700" },
    { bg: "bg-amber-50", border: "border-amber-100", accent: "text-amber-700" },
    { bg: "bg-emerald-50", border: "border-emerald-100", accent: "text-emerald-700" },
    { bg: "bg-indigo-50", border: "border-indigo-100", accent: "text-indigo-700" },
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
        showCustomerVendorManagement={
          profileRole === "admin" || profileRole === "super_admin"
        }
      />

      <main className="flex-1 px-6 py-8">
        <header className="relative mb-6 overflow-hidden rounded-[32px] bg-linear-to-br from-[#0ea5e9] via-[#2563eb] to-[#05c3de] p-6 text-white shadow-xl shadow-cyan-200/60">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute left-1/3 top-4 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
          </div>
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur">
                {isServiceRole ? "Service" : "Lead management"}
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                  {(profileRole ?? "").replace(/-/g, " ")}
                </span>
              </span>
              <h1 className="text-3xl font-semibold leading-tight text-white">
                {isServiceRole
                  ? `${profileName || "Service lead"}, keep the field humming.`
                  : profileRole === "admin" || profileRole === "super_admin"
                    ? "Lead control room"
                    : "Sales Manager lead control room"}
              </h1>
              <p className="max-w-2xl text-sm text-white/80">
                {isServiceRole
                  ? "Monitor workload, dispatch efficiency, and escalations in one view."
                  : "Approve quotes, reassign stuck deals, and keep the funnel healthy with faster follow-ups."}
              </p>
              {!isServiceRole && (
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-white backdrop-blur">
                    Pending approvals: {pendingApprovals.length}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-white backdrop-blur">
                    At-risk: {atRiskLeads.length}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-white backdrop-blur">
                    Hot leads: {hotLeads.length}
                  </span>
                </div>
              )}
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
                  {caps.canAssign && (
                    <button className="rounded-full border border-white/70 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800">
                      Approval queue
                    </button>
                  )}
                  {caps.canAssign && (
                    <button className="rounded-full border border-white/70 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800">
                      Bulk reassign
                    </button>
                  )}
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

        {!isServiceRole && (
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
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Approval queue
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {pendingApprovals.length} waiting for manager decision
                </p>
              </div>
              {caps.canApproveQuotation && (
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                    Needs review
                  </span>
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
                  className="relative overflow-hidden rounded-2xl border border-slate-100 bg-linear-to-br from-white via-slate-50 to-indigo-50 p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
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
                    <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                      {lead.product}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                      {lead.owner}
                    </span>
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
                    Next: {lead.nextAction} • {lead.nextAt}
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

        {isFinanceRole && (
          <section className="mt-6 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Finance cockpit
                </p>
                <p className="text-sm text-slate-600">
                  Payments, credit notes, and debit notes for won/order-linked leads.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <button
                  onClick={addPayment}
                  className="rounded-full bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-2 text-white shadow-sm shadow-emerald-200 transition hover:brightness-105"
                >
                  + Record payment
                </button>
                <button
                  onClick={addCreditNote}
                  className="rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-4 py-2 text-white shadow-sm shadow-amber-200 transition hover:brightness-105"
                >
                  + Credit note
                </button>
                <button
                  onClick={addDebitNote}
                  className="rounded-full bg-linear-to-r from-rose-500 to-red-500 px-4 py-2 text-white shadow-sm shadow-rose-200 transition hover:brightness-105"
                >
                  + Debit note
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-linear-to-br from-slate-50 to-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Payments
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {payments.length}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{p.amount}</p>
                        <p className="text-xs text-slate-500">
                          {p.mode} · {p.date} · {p.leadId}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                        Receipt
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-linear-to-br from-slate-50 to-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Credit notes
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {credits.length}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  {credits.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{c.amount}</p>
                        <p className="text-xs text-slate-500">
                          {c.date} · {c.leadId}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-600">
                        Credit
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-linear-to-br from-slate-50 to-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Debit notes
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {debits.length}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  {debits.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{d.amount}</p>
                        <p className="text-xs text-slate-500">
                          {d.date} · {d.leadId}
                        </p>
                      </div>
                      <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600">
                        Debit
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
          </>
        )}
        <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            {(["All", ...activeStageOrder] as const).map((stage) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedStage === stage
                    ? "bg-cyan-500 text-white shadow-sm shadow-cyan-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {(["All", "Hot", "Warm", "Cold"] as const).map((temp) => (
              <button
                key={temp}
                onClick={() => setSelectedTemp(temp)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedTemp === temp
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {temp}
              </button>
            ))}
            <div className="ml-3 flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-inner">
              <button
                className={`rounded-full px-3 py-1 ${
                  viewMode === "table" ? "bg-cyan-500 text-white" : ""
                }`}
                onClick={() => setViewMode("table")}
              >
                Table
              </button>
              <button
                className={`rounded-full px-3 py-1 ${
                  viewMode === "pipeline" ? "bg-cyan-500 text-white" : ""
                }`}
                onClick={() => setViewMode("pipeline")}
              >
                Pipeline
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          {viewMode === "table" ? (
            <div className="overflow-auto">
              <table className="min-w-full text-sm text-slate-700">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    {[
                      "Lead",
                      "Owner",
                      "Role",
                      "Zone/State",
                      "Product",
                      "Stage",
                      "Temperature",
                      "Next Action",
                      "Actions",
                    ].map((header) => (
                      <th key={header} className="px-3 py-3 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {lead.customer}{" "}
                        <span className="text-xs font-medium text-slate-500">
                          ({lead.id})
                        </span>
                        <div className="text-xs text-slate-500">
                          {lead.company}
                        </div>
                      </td>
                      <td className="px-3 py-3">{lead.owner}</td>
                      <td className="px-3 py-3 capitalize">{lead.role.replace(/-/g, " ")}</td>
                      <td className="px-3 py-3">
                        {lead.zone} / {lead.state}
                      </td>
                      <td className="px-3 py-3">{lead.product}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">
                          {lead.stage}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            lead.temperature === "Hot"
                              ? "bg-rose-50 text-rose-600"
                              : lead.temperature === "Warm"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {lead.temperature}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        <div className="font-semibold text-slate-900">
                          {lead.nextAction}
                        </div>
                        <div className="text-slate-500">{lead.nextAt}</div>
                      </td>
                      <td className="px-3 py-3">
                        {isServiceRole ? (
                          renderServiceActions(lead)
                        ) : (
                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            {caps.canAssign && !caps.readOnly && (
                              <button
                                className="rounded-full bg-indigo-500 px-3 py-1.5 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                                onClick={() => handleAssign(lead.id, "Sales Executive")}
                              >
                                Assign
                              </button>
                            )}
                            {caps.canApproveQuotation && lead.stage === "Pending Approval" && !caps.readOnly && (
                              <button
                                className="rounded-full bg-emerald-500 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                                onClick={() => handleStageChange(lead.id, "Approved")}
                              >
                                Approve
                              </button>
                            )}
                            {lead.stage === "In Discussion" && caps.canRequestQuotation && !caps.readOnly && (
                              <button
                                className="rounded-full bg-amber-500 px-3 py-1.5 text-white shadow-sm shadow-amber-200 transition hover:bg-amber-400"
                                onClick={() => handleStageChange(lead.id, "Pending Approval")}
                              >
                                Request Quote
                              </button>
                            )}
                            {lead.stage !== "Won" && lead.stage !== "Lost" && caps.canClose && !caps.readOnly && (
                              <>
                                <button
                                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-500"
                                  onClick={() => handleStageChange(lead.id, "Won")}
                                >
                                  Close Won
                                </button>
                                <button
                                  className="rounded-full bg-rose-500 px-3 py-1.5 text-white shadow-sm shadow-rose-200 transition hover:bg-rose-400"
                                  onClick={() => handleStageChange(lead.id, "Lost")}
                                >
                                  Close Lost
                                </button>
                              </>
                            )}
                            {isFinanceRole && lead.stage === "Won" && (
                              <>
                                <button
                                  className="rounded-full bg-linear-to-r from-cyan-500 to-sky-500 px-3 py-1.5 text-white shadow-sm shadow-cyan-200 transition hover:brightness-105"
                                  onClick={() => handleFinanceAction(lead.id, "Invoice")}
                                >
                                  Invoice
                                </button>
                                <button
                                  className="rounded-full bg-linear-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:brightness-105"
                                  onClick={() => handleFinanceAction(lead.id, "Payment receipt")}
                                >
                                  Record Payment
                                </button>
                                <button
                                  className="rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-white shadow-sm shadow-amber-200 transition hover:brightness-105"
                                  onClick={() => handleFinanceAction(lead.id, "Credit note")}
                                >
                                  Credit Note
                                </button>
                                <button
                                  className="rounded-full bg-linear-to-r from-rose-500 to-red-500 px-3 py-1.5 text-white shadow-sm shadow-rose-200 transition hover:brightness-105"
                                  onClick={() => handleFinanceAction(lead.id, "Debit note")}
                                >
                                  Debit Note
                                </button>
                                <button
                                  className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-cyan-700 shadow-sm transition hover:bg-cyan-50"
                                  onClick={() => handleFinanceAction(lead.id, "Ledger view")}
                                >
                                  Ledger
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {pipelineColumns.map((column) => (
                <div
                  key={column.stage}
                  className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {column.stage}
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {column.items.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {column.items.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-2xl border border-slate-100 bg-linear-to-br from-white to-cyan-50 p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            {lead.customer}
                          </p>
                          <span className="text-xs font-semibold text-slate-500">
                            {lead.value}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{lead.product}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                          <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                            {lead.owner}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
                            {lead.temperature}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          Next: {lead.nextAction} · {lead.nextAt}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                          {isServiceRole ? (
                            renderServiceActions(lead)
                          ) : (
                            <>
                              {caps.canAssign && !caps.readOnly && (
                                <button
                                  className="rounded-full bg-indigo-500 px-3 py-1.5 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                                  onClick={() => handleAssign(lead.id, "Sales Executive")}
                                >
                                  Assign
                                </button>
                              )}
                              {caps.canApproveQuotation && lead.stage === "Pending Approval" && !caps.readOnly && (
                                <button
                                  className="rounded-full bg-emerald-500 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                                  onClick={() => handleStageChange(lead.id, "Approved")}
                                >
                                  Approve
                                </button>
                              )}
                              {lead.stage === "In Discussion" && caps.canRequestQuotation && !caps.readOnly && (
                                <button
                                  className="rounded-full bg-amber-500 px-3 py-1.5 text-white shadow-sm shadow-amber-200 transition hover:bg-amber-400"
                                  onClick={() => handleStageChange(lead.id, "Pending Approval")}
                                >
                                  Request Quote
                                </button>
                              )}
                              {isFinanceRole && lead.stage === "Won" && (
                                <>
                                  <button
                                    className="rounded-full bg-linear-to-r from-cyan-500 to-sky-500 px-3 py-1.5 text-white shadow-sm shadow-cyan-200 transition hover:brightness-105"
                                    onClick={() => handleFinanceAction(lead.id, "Invoice")}
                                  >
                                    Invoice
                                  </button>
                                  <button
                                    className="rounded-full bg-linear-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:brightness-105"
                                    onClick={() => handleFinanceAction(lead.id, "Payment receipt")}
                                  >
                                    Record Payment
                                  </button>
                                  <button
                                    className="rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-white shadow-sm shadow-amber-200 transition hover:brightness-105"
                                    onClick={() => handleFinanceAction(lead.id, "Credit note")}
                                  >
                                    Credit Note
                                  </button>
                                  <button
                                    className="rounded-full bg-linear-to-r from-rose-500 to-red-500 px-3 py-1.5 text-white shadow-sm shadow-rose-200 transition hover:brightness-105"
                                    onClick={() => handleFinanceAction(lead.id, "Debit note")}
                                  >
                                    Debit Note
                                  </button>
                                  <button
                                    className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-cyan-700 shadow-sm transition hover:bg-cyan-50"
                                    onClick={() => handleFinanceAction(lead.id, "Ledger view")}
                                  >
                                    Ledger
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      {toast && <LeadToast message={toast} />}
    </div>
  );
}

function LeadToast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center">
      <div
        className="mt-10 rounded-3xl bg-linear-to-r from-cyan-200 via-cyan-300 to-sky-300 px-6 py-4 text-sm font-semibold text-slate-900 shadow-[0_15px_40px_rgba(14,165,233,0.35)] backdrop-blur"
        style={{
          animation: "toastPop 220ms ease, toastFade 320ms ease 2.7s forwards",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-base font-bold text-cyan-700 shadow-inner shadow-cyan-100">
            ✓
          </span>
          <p className="text-base font-semibold leading-snug">{message}</p>
        </div>
      </div>
      <style jsx>{`
        @keyframes toastPop {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes toastFade {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-6px) scale(0.99);
          }
        }
      `}</style>
    </div>
  );
}

