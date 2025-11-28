
# Lead Flow — Sales Manager Role

## 1. Purpose
This document serves as the complete blueprint for implementing all **Sales Manager Lead Management flows** in the Web CRM.  
It includes responsibilities, UI design logic, workflow structure, permissions, and API behaviors.

---

## 2. Sales Manager – Role Summary
The **Sales Manager** is responsible for:
- Supervising Sales Executives
- Approving / Rejecting quotation requests
- Managing team leads and pipeline
- Reassigning leads within team
- Monitoring follow-ups, aging, at-risk deals
- Handling special commodity or escalated leads
- Overriding lead closure when appropriate

---

## 3. Lead Stages (Manager Perspective)

| Stage | Meaning |
|-------|---------|
| `new` | Newly created lead |
| `in_discussion` | Executive working the lead |
| `pending_manager_approval` | Quotation requested by Executive |
| `approved_for_quotation` | Manager approved request |
| `quoted` | Quotation generated |
| `won` | Lead converted to order |
| `lost` / `dropped` | Lead closed |

Manager interacts mainly with:

- `in_discussion → pending_manager_approval`
- `pending_manager_approval → approved_for_quotation`
- `pending_manager_approval → in_discussion` (Reject)
- Any → `won/lost/dropped` (Override)

---

## 4. Manager-Specific Lead Lifecycle

### 4.1 Lead Assigned
- Lead created by Coordinator/Executive.
- Assigned to Executive under the Manager’s team.
- Appears in: Dashboard → Team Leads

### 4.2 Executive Works Lead
- Executive calls, visits, logs activity.
- Clicks **Request Quotation**.
- Lead enters `pending_manager_approval`.

### 4.3 Approval Queue
Manager reviews:
- Lead summary
- Timeline & activities
- Attachments
- Quotation request details

**Actions:**
- **Approve** → moves to `approved_for_quotation`
- **Reject** → returns to `in_discussion` (comment required)
- **Need More Info** → remains pending

### 4.4 Escalations & Reassignments
Manager can:
- Reassign leads within team
- Mark leads as **At Risk** or **High Priority**
- Intervene on critical or escalated leads

### 4.5 Risk Handling Logic
Lead becomes **at_risk = true** when:
- `last_activity_at > X days` (configurable)

Manager actions:
- Reassign lead
- Add activity
- Ask for recovery plan
- Close if necessary

### 4.6 Override Closure
Manager can close:
- `won`
- `lost`
- `dropped`

Reasons are mandatory.

Audit logs must record:
- `closed_by_manager`

---

## 5. Sales Manager UI Pages

### 5.1 Dashboard (`/manager/leads/dashboard`)

**Widgets:**
- Pipeline summary
- Funnel visualization
- Overdue follow-ups
- At risk leads
- Pending approvals
- Team performance KPIs

**Filters:**
- Stage, Executive, Region
- Commodity/Product
- Temperature
- Date range

---

### 5.2 Approval Queue (`/manager/leads/approvals`)

**Table:**
- Customer
- Owner
- Last activity
- Discount requested
- Estimated value
- Stage
- Age
- Actions: Approve / Reject / View Lead

**Reject Action:**
- Requires comment
- Lead stage → `in_discussion`

---

### 5.3 Lead Detail Page (`/leads/:id`)

Sales Manager sees extended controls:

| Section | Function |
|--------|----------|
| Header | Stage, Temperature, Owner, Age |
| Activity Timeline | Full team-level visibility |
| Quotation Request Panel | Shows requested discount & remarks |
| Action Bar | Approve / Reject / Reassign / Close / Risk Toggle |
| Audit Trail | View all changes |

---

### 5.4 Bulk Reassignment (`/manager/leads/reassign`)
- Multi-select leads
- Choose new Executive (team only)
- Reason mandatory
- Preview before applying

---

## 6. API Endpoints

### 6.1 Dashboard Summary  
`GET /api/dashboard/manager/summary`

### 6.2 Fetch Approval Requests  
`GET /api/approval/quotations?managerId={id}&status=pending`

### 6.3 Approve Quotation  
`POST /api/quotations/{leadId}/approve`

### 6.4 Reject Quotation  
`POST /api/quotations/{leadId}/reject`

### 6.5 Reassign Lead  
`POST /api/leads/{leadId}/reassign`

### 6.6 Close Lead  
`POST /api/leads/{leadId}/close`

---

## 7. Business Rules

### Approval Rules
- Lead must be in `pending_manager_approval`
- Manager must own the team
- Activity within last X days required (optional)

### Reassignment Rules
- Only within Manager’s team
- Requires reason

### At Risk Rules
Automatically triggered based on:
- Last activity > threshold

### Discount Thresholds
If discount > limit:
- Show warning: “Director approval required”
- Manager cannot approve

---

## 8. Notifications

### Real-time
- New approval request
- At-risk lead triggered
- Overdue follow-up
- High-value lead update

### Daily Digest
- Pending approvals
- At-risk count
- Overdue follow-ups
- Win/Loss summary

---

## 9. Audit Requirements

Save the following fields:

- `approved_by`, `approved_at`
- `rejected_by`, `rejected_at`, `rejection_comment`
- `assignment_history[]`
- `closed_by`, `closed_at`, `closed_reason`, `closed_status`
- `at_risk_updated_at`

---

## 10. Sales Manager Permission Matrix

| Feature | Access |
|--------|--------|
| View Lead List | ✔ |
| View Lead Detail | ✔ |
| Assign Lead | ✔ (team only) |
| Approve Quotation | ✔ |
| Reject Quotation | ✔ |
| Close Lead | ✔ |
| Add Follow-up | ✔ |
| Add Activity | ✔ |
| Override Owner | ✔ (team only) |
| Bulk Assign | ✔ |
| Export Leads | ✔ |
| Request Quotation | ✖ |
| Edit Admin Settings | ✖ |

---

## 11. Acceptance Criteria

- Manager can view full team pipeline
- Approval queue is functional
- Approval/rejection triggers correct state transitions
- Audit logs reflect actions
- Reassign works within rules
- At-risk leads display properly
- Override closure is logged
- UI permissions correctly reflect matrix

---

This file contains ALL the required logic, structure, and UI flow needed to build the Sales Manager Lead Management pages.

