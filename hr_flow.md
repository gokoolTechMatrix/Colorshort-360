# HR Dashboard – UI & Flow (Manufacturing Company)

## 1. Role Overview
HR Manager / HR Executive dashboard designed for a **manufacturing + field service company** (e.g., ColorSort360). The dashboard enables HR to manage workforce health, attendance, approvals, hiring, training, and compliance from a single screen.

---

## 2. Top-Level Page Layout
The dashboard contains **five core areas**:

1. **Top App Bar** — Title, search, profile, notifications  
2. **Filter Strip** — Location, department, date range, shift  
3. **KPI Cards Row** — Workforce summary  
4. **Navigation Cards & Quick Actions** — Module shortcuts  
5. **Main Widgets** — Attendance, approvals, joinings/exits, skills, field status, analytics

```
---------------------------------------------------------
|  Top App Bar                                          |
---------------------------------------------------------
|  Filter Strip                                         |
---------------------------------------------------------
|  KPI Cards Row (4–6 cards)                            |
---------------------------------------------------------
|  Navigation Cards (modules)      |  Quick Actions     |
---------------------------------------------------------
|  Main Widgets:                                       |
|   - Attendance Snapshot                              |
|   - Pending Approvals                               |
|   - Joinings & Exits                                |
|   - Hiring Pipeline                                 |
|   - Skills & Certification Alerts                   |
|   - Field Force Status                              |
|   - HR Analytics                                    |
---------------------------------------------------------
```

---

## 3. Top App Bar
### Elements
- **Left**
  - Title: **HR Dashboard**
  - Subtitle: *Workforce • Attendance • Approvals • Compliance*
- **Center**
  - Global Search: _Search employee / code / mobile / request ID_
- **Right**
  - Notifications  
  - Help  
  - HR Profile Avatar (e.g., Priya – HR Manager)

---

## 4. Global Filter Strip
Affects all KPIs & widgets.

- **Location:** All Locations, HO, Factory–Coimbatore, Service–South, Service–North  
- **Department:** All, Production, Sales, Service, Stores, Accounts, Management  
- **Date Range:** Today, This Week, This Month, Last 30 Days, Custom  
- **Shift:** All, General, Shift A, Shift B, Night  

Button: **Reset Filters**

---

## 5. KPI Cards

### 5.1 Primary KPIs
| KPI | Value | Description | Trend |
|-----|-------|-------------|--------|
| **Total Employees** | 138 | On-roll headcount | +6 quarterly |
| **Present Today** | 124 | All locations | 89.9% |
| **Today’s Absentees** | 14 | 4 unplanned | ↑ 2 vs yesterday |
| **Pending HR Approvals** | 19 | Leave, expenses, attendance | 7 due today |
| **Open Positions** | 5 | Recruitment ongoing | 2 offers sent |
| **Attrition (12M)** | 8.5% | Rolling attrition | Stable |

---

### 5.2 Secondary KPIs
| KPI | Value | Insight |
|------|--------|---------|
| Overtime (This Month) | 212 hrs | High in Production |
| Training Coverage | 78% | Target: 90% |
| Leave Utilization | 62% | YTD usage |
| Certification Expiry (30 Days) | 5 | 3 Service, 2 Electrical |

---

## 6. Navigation Cards (Modules)
Grid layout with clickable cards:

1. **Employee Directory** – Profiles, contacts  
2. **Attendance & Shifts** – Daily attendance, shifts, regularization  
3. **Leave Management** – Approvals, balances  
4. **Travel & Expense** – Claims, reimbursements  
5. **Recruitment & Onboarding** – Hiring pipeline  
6. **Training & Skill Matrix** – Compliance, skill levels  
7. **Performance & Appraisals** – KPI review  
8. **HR Analytics** – Headcount, attrition, overtime  

---

## 7. Quick Actions
- + Add Employee  
- Approve Today’s Leaves  
- Approve Regularizations  
- Approve Expenses  
- Publish Shift Roster  
- Assign Training  
- Export Attendance (Payroll)  
- Download HR MIS  

---

## 8. Main Dashboard Widgets

---

### 8.1 Attendance Snapshot (Department-wise)

**Summary Row:**  
`Total: 138 | Present: 124 | Absent: 14 | On Leave: 7 | On Field: 32 | Unmarked: 3`

| Department | Total | Present | Absent | On Leave | On Field | Unmarked | Present % |
|------------|--------|----------|---------|-----------|-----------|-----------|-------------|
| Production | 44 | 38 | 2 | 3 | 0 | 1 | 86% |
| Service | 41 | 33 | 3 | 0 | 5 | 0 | 80% |
| Sales | 22 | 19 | 1 | 0 | 2 | 0 | 86% |
| Stores | 9 | 8 | 0 | 1 | 0 | 0 | 89% |
| Accounts | 13 | 12 | 1 | 0 | 0 | 0 | 92% |
| Management | 9 | 8 | 0 | 1 | 0 | 0 | 89% |

**Actions:** Click counts → Employee list modal.

---

### 8.2 Pending Approvals
Tabs: **All, Leave, Attendance, Expense, Roster**

| Type | Req ID | Employee | Dept | Details | Requested On | Ageing | Action |
|------|---------|-----------|--------|--------------|----------------|----------|-----------|
| Leave | LV-091 | Praveen Kumar | Service | 2 days Sick Leave | 24 Nov | 1 day | Review |
| Expense | EX-144 | Divya S | Sales | ₹3,250 | 23 Nov | 2 days | Review |
| Attendance | AT-057 | Selvam | Production | Missed punch | 24 Nov | 1 day | Review |
| Roster | RS-017 | Sathish | Production | Shift B → General | 24 Nov | <1 day | Review |

---

### 8.3 Upcoming Joinings & Exits
| Type | Employee / Position | Dept | Location | Effective Date | Status | Action |
|------|----------------------|--------|-----------|------------------|----------|-------------|
| Joining | Service Engineer Trainee | Service | Factory | 02 Dec | Offer Accepted | Induction Plan |
| Joining | Accounts Executive | Accounts | HO | 05 Dec | Shortlisted | Schedule HR Round |
| Exit | Mohanraj | Stores | Factory | 30 Nov | Notice Period | Plan Handover |

---

### 8.4 Recruitment Overview
| Position | Dept | Location | Required By | Pipeline | Stage | Risk |
|----------|--------|-----------|----------------|------------|-----------|----------|
| Service Engineer | Service | Madurai | 10 Dec | 6 | Interview | On Track |
| Stores Supervisor | Stores | Factory | 15 Dec | 2 | Sourcing | At Risk |
| Production Operator | Production | Factory | 01 Jan | 4 | Sourcing | On Track |

---

### 8.5 Skills & Certification Alerts
| Employee | Dept | Certification | Issuer | Expiry | Risk | Action |
|----------|--------|---------------------------|-----------|-----------|---------|-----------|
| Suresh P | Service | Electrical Safety – HT | TNEB | 12 Dec | High | Renew |
| Arun K | Service | Sorter Installation Master | Internal | 20 Dec | Medium | Enroll |
| Vimal | Production | Forklift License | RTO | 05 Jan | Medium | Alert Manager |

---

### 8.6 Field Force Status (Technicians)
| Technician | Region | Skill | First Job | Jobs Today | Check-in Status | Last Updated |
|------------|-----------|----------------|---------------|------------------|------------------|----------------|
| Arun K | Coimbatore | Installation | 9:15 AM | 3 | On Job | 10:22 AM |
| Mahesh | Guntur | Calibration | — | 2 | Not Checked-in | — |
| Kumar | Davanagere | Electrical | 8:50 AM | 4 | Checked-in | 10:05 AM |

---

### 8.7 HR Analytics (Mini Charts)
- **Headcount vs Time** (line chart)  
- **Attrition Trend** (line chart)  
- **Overtime by Department** (bar chart)  
- **Leave Type Distribution** (donut chart)  

---

## 9. Detail Panels (Slide-Over)

### When clicking on:
- **Absentees →** list of employees with contact, shift, manager  
- **Pending Approvals →** approval modal  
- **Employee →** profile summary:  
  - Attendance (7 days)  
  - Leave balance  
  - Certifications  
  - Manager & work location  

---

## 10. Flow Examples

### 10.1 Approve Today’s Leaves
1. Click **Approve Today’s Leaves**  
2. Auto-filtered list opens  
3. Approve/Reject  
4. Attendance recalculates  

---

### 10.2 Regularize Attendance
1. Click **Unmarked = 3**  
2. View employee list  
3. Approve missed punch  
4. System updates payroll metrics  

---

### 10.3 Publish Shift Roster
1. Open roster → week/month view  
2. Drag & drop shifts  
3. Click Publish  
4. Notify employees  

---

### 10.4 Assign Technician Training
1. Go to Skills Alerts  
2. Select technicians with expiring certificates  
3. Assign training  

---

### 10.5 Export Payroll Attendance
1. Quick Action → Export Attendance  
2. Select department/location/date  
3. Validate missing punch approvals  
4. Download Excel/CSV  

---

## 11. UI Style Guidelines
- **Primary Color:** Deep blue/teal (ColorSort style)  
- **Accent Colors:** Orange (alerts) & Green (success)  
- Minimal icons, clean card layout, high whitespace  
- Table-heavy but visually balanced  

---

This is the full, untruncated HR dashboard markdown file content for **hr_flow.md**.
