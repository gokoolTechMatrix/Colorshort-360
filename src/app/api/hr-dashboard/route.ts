import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

const fallbackData = {
  filters: {
    locations: [
      "All Locations",
      "HO",
      "Factory-Coimbatore",
      "Service-South",
      "Service-North",
    ],
    departments: [
      "All",
      "Production",
      "Sales",
      "Service",
      "Stores",
      "Accounts",
      "Management",
    ],
    dateRanges: ["Today", "This Week", "This Month", "Last 30 Days", "Custom"],
    shifts: ["All", "General", "Shift A", "Shift B", "Night"],
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

type PrimaryKpiRow = { label: string; value: number | string; detail: string; trend: string };
type HrPayload = Omit<typeof fallbackData, "kpis"> & {
  kpis: { primary: PrimaryKpiRow[]; secondary: typeof fallbackData.kpis.secondary };
};

const safeLoad = async <T,>(table: string, transform: (rows: T[]) => void) => {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      if (error.code === "42P01") {
        return;
      }
      throw error;
    }
    if (data) {
      transform(data as T[]);
    }
  } catch {
    // ignore and keep fallback data
    return;
  }
};

export async function GET() {
  const payload = structuredClone(fallbackData) as HrPayload;
  try {
    await safeLoad<{ label: string; value: number | string; detail?: string; trend?: string }>(
      "hr_kpis",
      (rows) => {
        payload.kpis.primary = rows
          .filter((r) => r.detail)
          .map(
            (r): PrimaryKpiRow => ({
              label: r.label,
              value: typeof r.value === "number" ? r.value : String(r.value),
              detail: r.detail ?? "",
              trend: r.trend ?? "",
            }),
          );
      },
    );

    await safeLoad<{ department: string; total: number; present: number; absent: number; leave: number; onField: number; unmarked: number; presentPercent: number }>(
      "hr_attendance_by_dept",
      (rows) => {
        payload.attendance.rows = rows;
        const totals = rows.reduce(
          (acc, row) => ({
            total: acc.total + (row.total ?? 0),
            present: acc.present + (row.present ?? 0),
            absent: acc.absent + (row.absent ?? 0),
            leave: acc.leave + (row.leave ?? 0),
            onField: acc.onField + (row.onField ?? 0),
            unmarked: acc.unmarked + (row.unmarked ?? 0),
          }),
          { total: 0, present: 0, absent: 0, leave: 0, onField: 0, unmarked: 0 },
        );
        payload.attendance.summary = { ...totals };
      },
    );

    await safeLoad<{ type: string; reqId: string; employee: string; dept: string; details: string; requestedOn: string; ageing: string }>(
      "hr_pending_approvals",
      (rows) => {
        payload.approvals = rows;
      },
    );

    await safeLoad<{ type: string; title: string; dept: string; location: string; date: string; status: string }>(
      "hr_joinings_exits",
      (rows) => {
        payload.joiningsExits = rows;
      },
    );

    await safeLoad<{ position: string; dept: string; location: string; requiredBy: string; pipeline: number; stage: string; risk: string }>(
      "hr_recruitment",
      (rows) => {
        payload.recruitment = rows;
      },
    );

    await safeLoad<{ employee: string; dept: string; certification: string; issuer: string; expiry: string; risk: string }>(
      "hr_skills",
      (rows) => {
        payload.skills = rows;
      },
    );

    await safeLoad<{ technician: string; region: string; skill: string; firstJob: string; jobsToday: number; checkInStatus: string; lastUpdated: string }>(
      "hr_field_status",
      (rows) => {
        payload.fieldStatus = rows;
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message, data: payload }, { status: 200 });
  }

  return NextResponse.json({ ok: true, data: payload });
}
