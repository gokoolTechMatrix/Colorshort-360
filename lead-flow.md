# Lead Management – Full Web App Flow (ColorSort360 CRM)
**File:** lead-flow.md  
**Version:** 1.0  
**Scope:** Web App – Lead Management (No mobile in this document)

---

## 1. Introduction

This document defines the **complete Lead Management module** for the **Web CRM** being built for ColorSort360 (TechMatrix AI).

It is designed to be:

- 💻 IDE-ready for developers  
- 🧩 Clear for UI/UX designers  
- ✅ Traceable to roles and client requirements  
- 🧪 Testable for QA through clearly defined flows

This file covers:

1. Roles & permissions  
2. Page-wise logic & UI layouts  
3. Role-wise behaviour on each page  
4. End-to-end lead lifecycle  
5. Database schema (lead-related tables)  
6. API endpoint structure (high level)  
7. Permission matrix  

---

## 2. Roles in Web Lead Management

### 2.1 Admin / Director

**Purpose:** Top-level owner of sales & CRM.

**Responsibilities**

- Full visibility of all leads across zones, states, products.
- Can edit any lead field.
- Can change owner, zone, and product mapping.
- Can mark a lead as Special Commodity / Special Machine and tag to a responsible manager.
- Can see all dashboards, KPIs, and detailed timelines.
- Can override incorrect closures or assignments.

**Functional Abilities**

- Create new leads (for strategic or referred leads).
- Edit any lead’s core data (even after assignment).
- Global bulk-assign / reassign leads.
- Override stage (e.g., revert incorrectly closed leads).
- Export all leads (for reporting, BI).
- View all activities, attachments, and history.

---

### 2.2 Zonal Manager

**Purpose:** Zone-level controller (North / South / East / West).

**Responsibilities**

- Oversees leads within assigned zone(s) only.
- Tracks pipeline and follow-ups for that zone.
- Reassigns leads to suitable Sales Executives within the zone.
- Acts as escalation layer for special leads in the zone.

**Functional Abilities**

- View all leads in the zone.
- Reassign leads between executives in that zone.
- Add internal notes and comments.
- Monitor lead aging, overdue follow-ups.
- Cannot directly approve quotations or close leads.

---

### 2.3 Product Manager

**Purpose:** Focused on particular product categories.

**Responsibilities**

- Oversees leads related to specific product categories.
- Works with Sales Managers to ensure proper allocation by product.
- Monitors pipeline quality for those product lines.

**Functional Abilities**

- View leads filtered by product category.
- Suggest or enforce reassignment based on product fit.
- Add product-specific comments.
- Cannot approve quotations or close leads directly.

---

### 2.4 Sales Manager

**Purpose:** Direct manager of a group of Sales Executives.

**Responsibilities**

- Approves “Request Quotation” transitions.
- Owns quality of follow-ups and pipeline for their team.
- Reassigns leads between Sales Executives in their team.
- Reviews meeting/demo notes before approving quotation.
- Can guide closure decisions.

**Functional Abilities**

- View all team leads.
- Approve or reject quotation requests.
- Reassign lead owner within team.
- Add final comments before quotation.
- Close leads on behalf of executives when needed.

---

### 2.5 Sales Coordinator (Web Only)

**Purpose:** Entry point for all raw leads.

**Responsibilities**

- Create leads from calls, email enquiries, and portals.
- Validate basic details (contact, state, commodity).
- Trigger initial assignment based on state/zone/product.
- Maintain hygiene of contact data.

**Functional Abilities**

- Create new leads.
- Edit basic details before assignment.
- See all leads (read-only on commercial parts).
- Assign leads to Sales Executives / Managers (initial only).
- Cannot approve quotations or close leads.

---

### 2.6 Sales Executive

**Purpose:** Main owner of day-to-day lead handling.

**Responsibilities**

- Work assigned leads: call, visit, email, demo.
- Maintain accurate, timely follow-up logs.
- Request quotation when lead is ready.
- Close lead after decision (Won / Lost / Dropped).

**Functional Abilities**

- View “My Leads” only by default.
- Log activities & schedule follow-ups.
- Change lead temperature (Hot/Warm/Cold).
- Submit “Request Quotation”.
- Close own leads with reasons.

---

## 3. Web Pages – Lead Management

### 3.1 Lead List / Pipeline Page

**URL:** `/leads`  

**Who uses it?** All sales roles (scope filtered by role).

**Core Features**

- Table view & Kanban pipeline view.
- Filters:
  - Source, State, Zone, Product, Owner, Stage, Temperature, Date Range.
- Quick Views:
  - My Leads (Executive)
  - My Team Leads (Manager)
  - My Zone Leads (Zonal Manager)
  - All Leads (Admin/Director)
- Bulk actions (role-based).
- “+ New Lead” button (top-right or floating).

**UI Layout (Concept)**

[Search & Filters Row]  
[Toggle: Table | Pipeline]  
[Main Content: Either Pipeline Columns or Table Rows]  
[Footer / Floating: + New Lead Button]

---

### 3.2 New Lead (Create) Page

**URL:** `/leads/new`  

**Who can create?** Coordinator, Executive, Admin/Director, (optionally Managers).

**Fields**

- Customer Name (text)  
- Contact Person (text)  
- Mobile (required)  
- Email (optional)  
- Company Name (text)  
- State (dropdown)  
- City (text / dropdown)  
- Zone (auto derived from state, readonly)  
- Commodity (required)  
- Product Category (dropdown)  
- Special Commodity? (toggle)  
- Lead Source (dropdown)  
- Purpose (Labour / Productivity / Cost)  
- Owner (auto-suggest; can be overridden by allowed roles)  

**Behaviours**

- Zone is auto-populated based on state using master mapping.
- Commodity is mandatory; cannot save without it.
- If “Special Commodity?” = true → lead flagged for Director view.
- On Save & View → redirect to Lead Detail.
- On Save & New → show new blank lead form.

---

### 3.3 Lead Detail Page

**URL:** `/leads/:id`

**Used By:** All roles.

**Sections**

1. Summary Header  
2. Customer & Lead Info  
3. Assignment Block  
4. Timeline Tab  
5. Attachments Tab  
6. Actions Toolbar  

**Role-Specific Actions**

- Sales Executive:
  - Edit own leads (if not locked by stage).
  - Log Activity.
  - Request Quotation.
  - Close Lead.

- Sales Manager:
  - Approve / Reject quotation requests.
  - Reassign owner within team.

- Director/Admin:
  - Full edit.
  - Special tagging.
  - Override owner/zone/stage.

---

### 3.4 Activity & Follow-Up

**Access From:** Lead Detail → “Log Activity”

**Fields**

- Activity Type: Call / Visit / Email / Demo  
- Notes: text  
- Outcome: text or dropdown  
- Next Follow-up Date & Time: optional  

**Behaviour**

- On save, activity appears in Timeline.
- Follow-up dates are used to show upcoming tasks per user.

---

### 3.5 Lead Assignment / Tagging Page

**URL:** `/leads/assign`

**Features**

- Filter leads (state, zone, product, source, special commodity).
- Checkbox selection of multiple leads.
- Assignment Controls:
  - New Owner (Sales Executive)
  - Zonal Manager
  - Product Manager
- Director-only:
  - Manual tagging override.
  - Dedicated special leads list.

---

### 3.6 Lead Approval (Request Quotation) Page

**Used by:**

- Sales Executive (trigger request)
- Sales Manager (approve/reject)

**Flow**

1. Executive clicks “Request Quotation” on Lead Detail.  
2. Lead stage becomes “Pending Manager Approval”.  
3. Manager sees entry in Approval Queue.  
4. Manager can:
   - Approve → stage “Approved for Quotation” and redirect to Quotation Create.
   - Reject → stays “In Discussion”, with comment.  

---

### 3.7 Lead Closure Page

**Triggered From:** Lead Detail → Close Lead

**Options**

- Won:
  - Optionally redirect to Quotation/Order.
- Lost:
  - Reason dropdown + comments.
- Dropped:
  - Free-text comments.

After closure:

- Lead becomes read-only for executive.
- Managers/Admin can still override if needed.

---

## 4. End-to-End Web Lead Flow

1. Lead Capture  
2. Auto Assignment  
3. Executive Works Lead  
4. Special Lead Tagging (if applicable)  
5. Request Quotation  
6. Manager Approval  
7. Quotation Creation (outside this module)  
8. Lead Closure (Won/Lost/Dropped)

---

## 5. Database Schema (Simplified)

**Table: leads**
- id (PK)
- customer_name
- contact_person
- mobile
- email
- company_name
- state_id
- city
- zone_id
- commodity_id
- product_category_id
- special_commodity (boolean)
- source
- purpose
- owner_id
- sales_manager_id
- zonal_manager_id
- product_manager_id
- stage
- temperature
- created_by_id
- created_at
- updated_at

**Table: lead_activities**
- id (PK)
- lead_id
- user_id
- type (call/visit/email/demo)
- notes
- outcome
- next_followup_at
- created_at

**Table: lead_assignment_history**
- id (PK)
- lead_id
- assigned_from_id
- assigned_to_id
- assigned_by_id
- assigned_at

---

## 6. API Structure (High Level)

- GET /api/leads
- POST /api/leads
- GET /api/leads/:id
- PUT /api/leads/:id
- POST /api/leads/:id/close
- POST /api/leads/:id/request-quotation
- POST /api/leads/:id/approve-quotation
- POST /api/leads/:id/reject-quotation
- POST /api/leads/:id/activities
- POST /api/leads/assign

---

## 7. Permission Matrix (Summary)

| Role              | Create | Edit              | Assign         | Approve Quotation | Close Lead         |
|-------------------|--------|-------------------|----------------|-------------------|--------------------|
| Admin/Director    | Yes    | Any               | Any            | Yes               | Any                |
| Zonal Manager     | Yes    | Zone-limited      | Zone-limited   | No                | No                 |
| Product Manager   | Yes    | Product-limited   | Product-limited| No                | No                 |
| Sales Manager     | Yes    | Team-limited      | Team-limited   | Yes               | Team leads         |
| Sales Coordinator | Yes    | Basic fields only | Initial only   | No                | No                 |
| Sales Executive   | Yes    | Own leads only    | No             | Request only      | Own leads          |

---

End of lead-flow.md
