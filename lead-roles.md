# Lead Management – Role-wise Permissions & Responsibilities

This document combines all key roles involved in **Lead Management (Web App)** and defines:
- Role Summary
- Core Responsibilities
- Access Permissions (Feature Matrix)
- UI Functions
- Restrictions

---

## 1. Sales Coordinator

### 🧑‍💼 Role Summary
The **Sales Coordinator** is responsible for capturing, validating, and assigning leads.  
This role is strictly **Web-only (No Mobile Access)**.

### 🎯 Core Responsibilities
- Capture new leads from:
  - IndiaMart / TradeIndia
  - Calls / Emails / Walk-ins
  - Website enquiries / Marketing campaigns
- Validate:
  - Contact information
  - State, Zone mapping
  - Commodity (mandatory)
  - Product category
- Initial lead assignment to Sales Executives based on:
  - State → Zone → Sales Manager mapping
- Maintain lead hygiene and update missing information.
- Cannot approve quotation, close lead, or move lead between stages.

### 🔐 Access Permissions (Web Only)

| Feature                    | Sales Coordinator Access           |
|---------------------------|------------------------------------|
| View Lead List            | ✔ Yes (all new/unassigned leads)   |
| View Lead Detail          | ✔ Yes (limited read/edit)          |
| Add Lead                  | ✔ Yes                              |
| Edit Lead                 | ✔ Yes (until assigned)             |
| Assign Lead               | ✔ Initial assignment allowed       |
| Reassign Lead             | ✔ Only before executive accepts    |
| Request Quotation         | ✖ No                               |
| Approve Quotation         | ✖ No                               |
| Add Activities            | ✖ No                               |
| Add Follow-up             | ✖ No                               |
| Close Lead                | ✖ No                               |
| View Special Leads        | ✔ Read-only                        |

### 🧭 UI Functions
- **New Lead Page**
- **Lead Edit Page**
- **Initial Assignment Page**
- **Lead List (Unassigned Leads filter)**

### 🚫 Restrictions
- Cannot modify lead after assigned to an Executive.
- Cannot access mobile app.
- Cannot approve quotation or close lead.

---

## 2. Sales Executive

### 🧑‍💼 Role Summary
The **Sales Executive** is the primary day-to-day owner of assigned leads.

### 🎯 Core Responsibilities
- Handle all assigned leads.
- Contact customers via call/visit.
- Add activities and follow-up actions.
- Update lead status and temperature.
- Request quotation approval from Sales Manager.
- Close lead (Won/Lost/Dropped).

### 🔐 Access Permissions

| Feature             | Sales Executive Access                        |
|--------------------|-----------------------------------------------|
| View Lead List     | ✔ Only assigned leads                         |
| View Lead Detail   | ✔ Yes                                         |
| Add Activities     | ✔ Yes                                         |
| Add Follow-up      | ✔ Yes                                         |
| Assign Lead        | ✖ No                                          |
| Request Quotation  | ✔ Yes (key responsibility)                    |
| Approve Quotation  | ✖ No                                          |
| Close Lead         | ✔ Yes (with reason)                           |
| View Special Leads | ✔ Yes (read-only)                             |
| Edit Lead Info     | ✔ Yes (basic fields only)                     |

### 🧭 UI Functions
- **My Leads Page**
- **Lead Detail + Quick Actions**
- **Activity Logging Modal**
- **Request Quotation Button**
- **Close Lead Modal**

### 🚫 Restrictions
- Cannot assign or reassign leads.
- Cannot approve quotations.
- Cannot override lead ownership.

---

## 3. Sales Manager

### 🧑‍💼 Role Summary
The **Sales Manager** oversees a team of Sales Executives and governs the approval workflow inside the Lead Management module.

### 🎯 Core Responsibilities
- Full supervision of team-level leads.
- Approve or reject *Request Quotation* submissions.
- Reassign leads between Sales Executives in the team.
- Monitor follow-ups, activities, lead aging, and progress.
- Close leads when escalation or override is required.
- Manage special machine/commodity lead evaluation.
- Support Zonal Manager or Director in escalated cases.

### 🔐 Access Permissions

| Feature                    | Sales Manager Access                          |
|---------------------------|-----------------------------------------------|
| View Lead List            | ✔ Full access to *team leads*                |
| View Lead Detail          | ✔ Full access (read + limited edit)          |
| View Activities           | ✔ Full access (team activities)              |
| Add Activities            | ✔ Yes (for monitoring or special cases)      |
| Assign Lead               | ✔ Yes (within their sales team only)         |
| Request Quotation         | ✖ No (handled by Sales Executive)            |
| Approve Quotation         | ✔ Yes (moves lead to “Approved for Quotation”) |
| Reject Quotation          | ✔ Yes (with mandatory comment)               |
| Close Lead                | ✔ Yes (override permission)                  |
| Add Follow-up             | ✔ Yes (can schedule follow-up for team members) |
| View Special Machine Leads| ✔ Yes (for evaluation & approval)            |
| Override Owner            | ✔ Yes (only inside own team)                 |
| Bulk Assignment           | ✔ Yes (team-level only)                      |
| Change Lead Stage         | ✔ Yes (except admin-restricted fields)       |
| Export Leads              | ✔ Yes (team-level export)                    |
| Dashboard Access          | ✔ Team performance, pipeline, follow-up delays |

### 🧭 UI Functions
- **Team Leads Dashboard**
- **Lead Detail Page (Approval Controls)**
- **Quotation Approval Page**
- **Bulk Reassignment Page**
- **Follow-up Manager View**
- **Special Machine Lead Review Panel**

### 🚫 Restrictions
- Cannot override leads outside their reporting structure.
- Cannot create or request quotations.
- Cannot edit admin-level fields such as commodity master, zone master, or special commodity access.

---

## 4. Service Manager

### 🧑‍🔧 Role Summary
The Service Manager is primarily responsible for post-order activities, but also participates in lead validation for technical feasibility.

### 🎯 Core Responsibilities in Lead Management
- Provide technical input for:
  - Product fit
  - Installation feasibility
  - Space/Power requirements
  - Special machine suitability
- View leads (Won + Special leads).
- Support Sales Team with pre-sales technical clarification.
- Prepare for installation after lead is Won:
  - Job card planning
  - Technician allocation
  - PAC/Checklists

### 🔐 Access Permissions

| Feature                    | Service Manager Access                   |
|---------------------------|-------------------------------------------|
| View Lead List            | ✔ Only Won + Escalation leads            |
| View Lead Detail          | ✔ Read-only                               |
| View Activities           | ✔ Read-only                               |
| Add Activities            | ✖ No                                      |
| Assign Lead               | ✖ No                                      |
| Request Quotation         | ✖ No                                      |
| Approve Quotation         | ✖ No                                      |
| Close Lead                | ✖ No                                      |
| Add Follow-up             | ✖ No                                      |
| View Special Leads        | ✔ Yes (read-only)                         |

### 🧭 UI Functions
- **Read-only Lead Viewer**
- **Special Lead Viewer**
- **Won Lead Viewer → Installation Planning**

### 🚫 Restrictions
- Cannot modify any lead data.
- Cannot participate in quotation workflow.
- No activity/follow-up creation.

---

## 5. Service Coordinator

### 🧑‍🔧 Role Summary
The **Service Coordinator** is not a primary lead role but interacts with lead data once the lead becomes an order.

### 🎯 Core Responsibilities
- Receive installation requests for Won leads.
- Schedule technicians (with Service Manager).
- Update installation statuses (internal CRM).
- Coordinate between Service Manager, Customer, and Technician.
- Read-only access to lead details for installation preparation.

### 🔐 Access Permissions

| Feature               | Service Coordinator Access     |
|----------------------|---------------------------------|
| View Lead List       | ✔ Only Won leads               |
| View Lead Detail     | ✔ Read-only                    |
| View Activities      | ✔ Read-only                    |
| Add Activities       | ✖ No                           |
| Assign Lead          | ✖ No                           |
| Request Quotation    | ✖ No                           |
| Approve Quotation    | ✖ No                           |
| Close Lead           | ✖ No                           |
| Add Follow-up        | ✖ No                           |
| Special Leads        | ✔ View only if required        |

### 🧭 UI Functions
- **Won Leads Viewer**
- **Installation Prep Viewer**

### 🚫 Restrictions
- No editing permissions.
- Cannot alter sales workflow.

---

## 6. Service Executive

### 🧑‍🔧 Role Summary
The Service Executive handles physical service tasks and installation work after lead is Won.

### 🎯 Core Responsibilities
- View Won Leads to prepare for installation.
- Execute installation jobs after conversion.
- Capture PAC, photos, customer signatures (service module).
- Report installation status to Service Coordinator/Manager.

### 🔐 Access Permissions

| Feature               | Service Executive Access         |
|----------------------|-----------------------------------|
| View Lead List       | ✔ Only Won leads                  |
| View Lead Detail     | ✔ Read-only                       |
| View Activities      | ✔ Read-only                       |
| Add Activities       | ✖ No (only in service module)     |
| Assign Lead          | ✖ No                              |
| Request Quotation    | ✖ No                              |
| Approve Quotation    | ✖ No                              |
| Close Lead           | ✖ No                              |
| Add Follow-up        | ✖ No                              |

### 🧭 UI Functions
- **Won Lead Viewer**
- **Installation Work Page** (in service module)

### 🚫 Restrictions
- No permission to modify any lead data.
- No access to sales functionalities.

---

## 7. HR Manager

### 🧑‍💼 Role Summary
The HR Manager does not directly interact with lead management but has read permissions in certain scenarios.

### 🎯 Core Responsibilities
- Manage attendance, payroll, and expenses.
- View approvals linked indirectly to leads (travel expense claims etc.).
- Verify Sales Team expense claims from lead visits.

### 🔐 Access Permissions

| Feature               | HR Access                                |
|----------------------|--------------------------------------------|
| View Lead List       | ✖ No (except linked expense entries)       |
| View Lead Detail     | ✖ No                                       |
| View Activities      | ✖ No                                       |
| Add Activities       | ✖ No                                       |
| Assign Lead          | ✖ No                                       |
| Request Quotation    | ✖ No                                       |
| Approve Quotation    | ✖ No                                       |
| Close Lead           | ✖ No                                       |
| Add Follow-up        | ✖ No                                       |
| Lead-linked Expenses | ✔ Yes (read-only for verification)         |

### 🧭 UI Functions
- **Expense Approval Page**
- **User Attendance & HR Dashboards**

### 🚫 Restrictions
- No direct lead access.
- No modification to any sales data.

---

