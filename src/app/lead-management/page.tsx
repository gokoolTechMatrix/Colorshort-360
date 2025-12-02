
"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type LeadStage =
  | "New"
  | "Contacted"
  | "Quotation Sent"
  | "Negotiation"
  | "Pending Approval"
  | "Closed"
  | "Won"
  | "Lost";

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
};

const mockLeads: Lead[] = [
  {
    id: "L-1023",
    customer: "Arun Kumar",
    company: "Delta Agro Mills",
    owner: "You",
    role: "sales-executive",
    zone: "South",
    state: "Tamil Nadu",
    product: "Rice Sorter",
    source: "Inbound Call",
    stage: "Negotiation",
    temperature: "Hot",
    value: "?118.5L",
    nextAction: "Schedule on-site demo",
    nextAt: "2025-11-30 11:00",
  },
  {
    id: "L-1102",
    customer: "Priya R",
    company: "Shree Pulses",
    owner: "You",
    role: "sales-executive",
    zone: "South",
    state: "Karnataka",
    product: "Pulse Sorter",
    source: "Portal",
    stage: "Quotation Sent",
    temperature: "Warm",
    value: "?19.8L",
    nextAction: "Send final quotation",
    nextAt: "2025-11-26 16:00",
  },
  {
    id: "L-1189",
    customer: "Sanjay",
    company: "Harvest Hub",
    owner: "You",
    role: "sales-executive",
    zone: "West",
    state: "Goa",
    product: "Cashew Sorter",
    source: "Email",
    stage: "New",
    temperature: "Warm",
    value: "?114.2L",
    nextAction: "Review demo notes",
    nextAt: "2025-11-27 17:00",
  },
];

const stageOrder: LeadStage[] = [
  "New",
  "Contacted",
  "Quotation Sent",
  "Negotiation",
  "Pending Approval",
  "Closed",
  "Won",
  "Lost",
];

export default function LeadManagementPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileName] = useState("Sales Executive");
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");
  const [selectedStage, setSelectedStage] = useState<LeadStage | "All">("All");
  const [selectedTemp, setSelectedTemp] = useState<LeadTemperature | "All">("All");
  const [toast, setToast] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [isRefreshingLeads, setIsRefreshingLeads] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(mockLeads[0]?.id ?? null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        if (selectedStage !== "All" && lead.stage !== selectedStage) return false;
        if (selectedTemp !== "All" && lead.temperature !== selectedTemp) return false;
        return lead.role === "sales-executive";
      }),
    [leads, selectedStage, selectedTemp],
  );

  const selectedLead =
    (selectedLeadId && filteredLeads.find((lead) => lead.id === selectedLeadId)) || filteredLeads[0] || null;

  useEffect(() => {
    if (!selectedLead) return;
    const [datePart, timePart] = selectedLead.nextAt.split(" ");
    setFollowUpDate(datePart || "");
    setFollowUpTime(timePart || "");
    setCallNotes(selectedLead.nextAction || "");
  }, [selectedLead]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);
  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    router.replace("/login");
  };

  const handleRefreshLeads = async () => {
    if (isRefreshingLeads) return;
    setIsRefreshingLeads(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setToast("Leads refreshed");
    setIsRefreshingLeads(false);
  };

  const handleStageChange = (leadId: string, stage: LeadStage) => {
    setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)));
    setToast(`Lead ${leadId} moved to ${stage}`);
  };

  const handleAssign = (leadId: string, owner: string) => {
    setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, owner } : lead)));
    setToast(`Lead ${leadId} assigned to ${owner}`);
  };

  const handleReceiveLead = () => {
    const nextId = `L-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newLead: Lead = {
      id: nextId,
      customer: "New Prospect",
      company: "Assigned Company",
      owner: profileName,
      role: "sales-executive",
      zone: "Assigned Zone",
      state: "Assigned State",
      product: "Colour Sorter",
      source: "Coordinator",
      stage: "New",
      temperature: "Warm",
      value: "?15.0L",
      nextAction: "Intro call",
      nextAt: new Date().toISOString().slice(0, 10),
    };
    setLeads((prev) => [newLead, ...prev]);
    setSelectedLeadId(newLead.id);
    setToast("New lead received");
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
    if (selectedLeadId === leadId) {
      setSelectedLeadId(null);
    }
    setToast("Lead deleted");
  };

  const handleSaveFollowUp = () => {
    if (!selectedLead) return;
    const nextAt = [followUpDate, followUpTime].filter(Boolean).join(" ");
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === selectedLead.id
          ? { ...lead, nextAt: nextAt || lead.nextAt, nextAction: callNotes || lead.nextAction }
          : lead,
      ),
    );
    setToast("Follow-up updated");
  };

  const handleSendQuotation = () => {
    if (!selectedLead) return;
    handleStageChange(selectedLead.id, "Quotation Sent");
  };

  const handleConvertToOrder = () => {
    if (!selectedLead) return;
    handleStageChange(selectedLead.id, "Closed");
    setToast("Converted to order");
  };

  const handleRequestEmi = () => setToast("EMI approval requested");
  const handleRequestDiscount = () => setToast("Discount approval requested");
  const handleCallReminder = () => selectedLead && setToast(`Call reminder set for ${selectedLead.customer}`);
  const handleTrackOrder = () => setToast("Tracking order status");

  const todaysFollowups = filteredLeads.filter((lead) => lead.nextAt.startsWith(new Date().toISOString().slice(0, 10))).length;
  const newLeadsToday = filteredLeads.filter((lead) => lead.stage === "New").length;
  const pendingQuotations = filteredLeads.filter((lead) => lead.stage === "Quotation Sent" || lead.stage === "Pending Approval").length;
  const pendingApprovals = filteredLeads.filter((lead) => lead.stage === "Pending Approval").length;
  const missedFollowups = filteredLeads.filter((lead) => { const nextDate = new Date(lead.nextAt.replace(" ", "T")); return !Number.isNaN(nextDate.getTime()) && nextDate.getTime() < Date.now(); }).length;
  const monthlyClosed = filteredLeads.filter((lead) => lead.stage === "Closed" || lead.stage === "Won").length;

  const kpis = [
    { label: "Today\"s Follow-Ups", value: todaysFollowups, subLabel: `${missedFollowups} missed` },
    { label: "New Leads Today", value: newLeadsToday, subLabel: "Fresh in your queue" },
    { label: "Pending Quotations", value: pendingQuotations, subLabel: "Send quotes ASAP" },
    { label: "Pending Approvals", value: pendingApprovals, subLabel: "Manager decision pending" },
    { label: "Missed Follow-Ups", value: missedFollowups, subLabel: "Resolve before EOD" },
    { label: "Monthly Sales Counter", value: monthlyClosed, subLabel: "Closed this month" },
  ];

  const pipelineColumns = stageOrder.map((stage) => ({ stage, items: filteredLeads.filter((lead) => lead.stage === stage) }));
