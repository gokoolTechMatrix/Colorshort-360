```markdown
# Qube — Lead Management Dashboard Spec

## 1. Page Overview

- Title: Qube — Lead Management [page:1]
- Primary user role: Sales Coordinator (e.g., “Muthu – Sales Coordinator”) [page:1]
- Layout: Single-page dashboard with header, navigation, KPI cards, status overview, and recent leads section [page:1]

High-level sections:

- Header with app name, user info, and Sign out
- Main navigation (Dashboard, New Lead, Client 360, My Leads, Reports)
- KPI / stat cards
- Lead Status Overview (with Status Breakdown and Quick Insights)
- Recent Leads (table-style list with Validation queue and recent activity) [page:1]

---

## 2. Header & Navigation

### 2.1 Header

-Left:App name / logo: “Q” (logo) + “Qube — Lead Management” 
-Right:User info and session actions:

- User name: “Myura
- Role: “Sales Coordinator”
- Action: “Sign out” button 

### 2.2 Primary Navigation

Horizontal navigation bar under header: 

- Dashboard (current page)
- New Lead →
- Client 360 →
- My Leads →
- Reports →

Active item (Dashboard):

- Highlight with bold text and/or underline
- Same background as nav bar, with subtle visual emphasis

---

## 3. KPI / Stat Cards (Top Metrics)

KPI section title (implicit through layout): Overview of your lead pipeline and activities

Three primary KPIs shown twice (number + label), plus one additional metric “Assigned”:

- Card 1:

  - Value: 10
  - Label: Total Leads

- Card 2:

  - Value: 1
  - Label: Validated

- Card 3:

  - Value: 0
  - Label: Pending

- Card 4:
  - Value: 4
  - Label: Assigned

Suggested layout:

- Desktop 4-column grid
- Tablet: 2-column grid
- Mobile: 1-column stacked

Suggested styling:

- White cards, rounded corners, light shadow
- Big bold number, smaller label below
- Optional subtle icon per card (e.g., leads, check, clock, user)

---

## 4. Lead Status Overview Section

### 4.1 Section Header

- Title: “Lead Status Overview”
- Subtitle: “Visual breakdown of your lead pipeline”

Place this section under the KPI cards, spanning full width or as a two-column layout.

### 4.2 Status Legend / Chart

Conceptual chart (pie/donut or bar) with legend entries:

- Assigned (4)
- Validated (1)

The page text shows:

- Legend item: “Assigned (4)” with legend icon
- Legend item: “Validated (1)” with legend icon

Use consistent colors for these statuses across the app.

### 4.3 Status Breakdown

Subsection with explicit label: “Status Breakdown”

Tabular or card-style metrics:

- Validated:

  - Count: 1
  - Percentage: 10%

- Assigned:

  - Count: 4
  - Percentage: 40%

- Total Pipeline:
  - Count: 10

Design:

- 3 mini-cards or a compact table in a single row
- Each item: Status name, count, percentage (if applicable)

### 4.4 Quick Insights

Subsection label: “Quick Insights”

Three minimal stat items:

- Validation Rate: 10%
- Assignment Rate: 40%
- Pending Review: 0
  Design:
- Small horizontal stat cards or text rows, aligned under Status Breakdown.

---

## 5. Recent Leads & Validation Queue

### 5.1 Section Header & Actions

Section header:

- Title: “Recent Leads”
- Subtitle: “Validation queue and recent activity”

Actions (top-right or top-left of this section):

- Button: “New Lead” →
- Button: “Export to Excel” (triggers export of recent/filtered leads)

### 5.2 Recent Leads List (Table-like)

Each lead appears as a card or row, with a heading as company name and a “#” line for ID
For each lead, fields shown:

- Company name (as an H3-style title)
- Lead ID prefixed by “#” line
- Status (text appended to company block)
- Region (e.g., Tamil Nadu / Tamilnadu)
- Date (MM/DD/YYYY)
- Temperature (Hot/Warm)
-

Lead entries from the page:

1.

- Company: NS
- ID: 251201
- Status: won
- Region: Tamil Nadu
- Date: 12/2/2025
- Temperature: Warm

2.

- Company: Matrix Smart
- ID: 251111
- Status: assigned
- Region: Tamil Nadu
- Date: 11/22/2025
- Temperature: Hot

3.

- Company: ABC COMPANY
- ID: 251110
- Status: assigned
- Region: Tamil Nadu
- Date: 11/18/2025
- Temperature: Hot

4.

- Company: Ayesha Cody
- ID: 251109
- Status: installed
- Region: Tamilnadu
- Date: 11/17/2025
- Temperature: Warm
-

5.

- Company: Qube
- ID: 251108
- Status: won
- Region: Tamilnadu
- Date: 11/15/2025
- Temperature: Warm

6.

- Company: Matrix
- ID: 251107
- Status: quotation_sent
- Region: Tamilnadu
- Date: 11/15/2025
- Temperature: Hot
-

7.

- Company: Yodas
- ID: 251106
- Status: won
- Region: Tamilnadu
- Date: 11/14/2025
- Temperature: Hot

8.

- Company: NS
- ID: 251105
- Status: assigned
- Region: Tamilnadu
- Date: 11/14/2025
- Temperature: Warm

9.

- Company: NS
- ID: 251104
- Status: assigned
- Region: Tamilnadu
- Date: 11/13/2025
- Temperature: Hot

10.

- Company: NS
- ID: bcb60b25
- Status: validated
- Region: Tamilnadu
- Date: 11/13/2025
- Temperature: Warm

### 5.3 Layout Recommendation

You can render these as:

- A classic table with columns: Company, ID, Status, Region, Date, Temperature, Actions
- Or stacked cards (current DOM looks like H3 per company with metadata below)

For functional parity:

- Show a fixed number of recent leads (e.g., 10)
- Maintain order by most recent date
- Treat this section as both “recent leads” and “validation queue” view.

---

## 6. Status & Temperature Semantics

From the dashboard data, inferred sets:

- Status values observed:

  - won
  - assigned
  - installed
  - quotation_sent
  - validated

- Region values:

  - Tamil Nadu
  - Tamilnadu

- Temperature values:
  - Hot
  - Warm

Use consistent color coding across:

- Lead status chips/badges
- Temperature indicators (e.g., Hot = red/orange, Warm = yellow/amber)

---

## 7. Functional Behavior Summary

- Dashboard loads:

  - KPI metrics (total leads, validated, pending, assigned)
  - Lead Status Overview with counts and percentages
  - Recent Leads list as “Validation queue and recent activity”

- “New Lead”:

  - Navigates to new lead creation form at /coordinator/new-lead

- “Export to Excel”:
  - Triggers export of the current set of recent/queued leads to an Excel file
- “View” per lead:

  - Navigates to lead detail route /coordinator/lead/{id or guid}

- Navigation items:
  - Switch to Client 360, My Leads, Reports views as separate pages

---

## 8. Suggested Data Model (for replication)

Core entities to support this dashboard:

- DashboardStats:

  - totalLeads: 10
  - validated: 1
  - pending: 0
  - assigned: 4
  - validationRate: 10
  - assignmentRate: 40
  - pendingReview: 0
  - totalPipeline: 10

- Lead:
  - id (e.g., "251201" or GUID)
  - externalRef (bcb60b25-type ID)
  - companyName
  - status
  - region
  - createdDate
  - temperature
  - detailUrl
```
