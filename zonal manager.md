# ZONAL MANAGER DASHBOARD  
### UI Specification • Layout Blueprint • Styling Guide  
**Version:** 1.0  
**Role:** Zonal Manager  
**Theme Reference:** Accountant Dashboard (Gradient Header + Pastel KPI Cards + Clean Section Blocks)

---

# 1. 🎨 THEME & DESIGN PRINCIPLES

### Primary UI Characteristics (Inherited from reference screenshot)
- **Full-width gradient header** (Blue → Cyan → Teal)
- **Rounded KPI cards** with soft pastel backgrounds
- **Thin section separators**
- **Long progress bars** in soft color tones
- **Card-based content groups**
- **Clean spacing, large padding, airy layout**
- **Bottom quick-action bar** with multicolored pill buttons

### Color Tones (Suggested)
- Gradient Header → `#1DA1F2 → #0FD1C5 → #14DFBD`
- Pastel Cards → Sky Blue, Pink Blush, Pale Yellow, Mint
- Bars:
  - Success → Green
  - Info → Blue
  - Warning → Amber
  - Danger → Red
- Background → Light Lavender Tint (#F6F7FB)

---

# 2. 🧭 OVERALL PAGE STRUCTURE

```
+========================================================================================================+
|                                       ZONAL MANAGER DASHBOARD                                         |
+========================================================================================================+
```

The dashboard is divided into:

1. **Header (Gradient Banner)**
2. **Top KPI Card Row**
3. **Zone Snapshot Metrics**
4. **Lead Aging Progress Bars**
5. **Executive Performance Bars**
6. **Follow-up Summary**
7. **Pending Tasks**
8. **Bottom Quick Action Bar**

---

# 3. 🟦 HEADER SECTION (GRADIENT BANNER)

```
+--------------------------------------------------------------------------------------------------------+
|  [🌈 Gradient Banner: Blue → Cyan → Teal]                                                              |
|                                                                                                        |
|  Zonal Manager Dashboard                                                                                |
|  Hello <Name>, your zone performance at a glance.                                                       |
|                                                                                                        |
|  [ + Assign Leads ]   [ View Approvals ]   [ Export Zone Report ]                                      |
|                                                                                                        |
+--------------------------------------------------------------------------------------------------------+
```

### Header Components
- **Large Title**: *Zonal Manager Dashboard*
- **Greeting Text**: *Hello <Name>…*
- **Right-Aligned Quick Actions**
  - + Assign Leads
  - View Approvals
  - Export Zone Report

### Styling Notes
- Text color: **White**
- Action buttons: **White border + light hover**
- Padding: **40px top / 32px bottom**
- Shadow: **subtle drop shadow**

---

# 4. 📊 TOP KPI CARD ROW (4 MAIN METRICS)

```
+--------------------------------------------------------------------------------------------------------+
| [Total Leads in Zone]   [New Leads This Week]   [Pending Approvals]   [Hot Leads]                      |
+--------------------------------------------------------------------------------------------------------+
```

### Each KPI Card Contains:
- **Title**
- **Value**
- **Subtext (dynamic change indicator)**

### KPI Definitions:
#### 1. Total Leads in Zone
```
Value: 1,280
Subtext: +5.3% vs last week
```

#### 2. New Leads This Week
```
Value: 112
Subtext: +18 new leads since yesterday
```

#### 3. Pending Approvals
```
Value: 34
Subtext: Quotation approvals pending
```

#### 4. Hot Leads
```
Value: 76
Subtext: Actively moving leads
```

### Styling Notes:
- Cards: **Soft pastel tones**
- Rounded corners: **16px**
- Shadow: **Medium blur**
- Font sizes:
  - Title: **14px**
  - Value: **28px bold**
  - Subtext: **12px muted grey**

---

# 5. 📅 ZONE SNAPSHOT — DAILY OVERVIEW

```
+--------------------------------------------------------------------------------------------------------+
|  Zone Snapshot                                                                                         |
|                                                                                                        |
|  [Leads Assigned Today]                      [Follow-ups Due Today]                                   |
|  Value: 54                                   Value: 89                                                 |
|  +14 vs yesterday                            -12 vs yesterday                                           |
|                                                                                                        |
|  [Conversions Today]                          [Escalations Raised]                                    |
|  Value: 7                                     Value: 2                                                  |
|  +2 since yesterday                           Zone-wide issues                                          |
+--------------------------------------------------------------------------------------------------------+
```

### Metrics Provided:
1. Leads Assigned Today
2. Follow-ups Due Today
3. Conversions Today
4. Escalations Raised

---

# 6. 📈 LEAD AGING PROGRESS BARS

```
+--------------------------------------------------------------------------------------------------------+
|  Lead Aging                                                                                             |
|                                                                                                        |
|  0–7 days        ████████████████████████████  420 Leads (green)                                       |
|  8–15 days       ████████████████              240 Leads (blue)                                        |
|  16–30 days      ████████                       140 Leads (amber)                                      |
|  30+ days        █████                          80 Leads  (red)                                        |
+--------------------------------------------------------------------------------------------------------+
```

---

# 7. 🧍‍♂️ EXECUTIVE PERFORMANCE (TOP EXECUTIVES)

```
+--------------------------------------------------------------------------------------------------------+
|  Executive Performance                                                                                  |
|                                                                                                        |
|  <Exec 1>    █████████████████████████████████   78 Leads Closed  [View]                              |
|  <Exec 2>    ████████████████████                 62 Leads Closed  [View]                              |
|  <Exec 3>    ██████████████                        38 Leads Closed  [View]                             |
|  <Exec 4>    █████████                              24 Leads Closed  [View]                             |
+--------------------------------------------------------------------------------------------------------+
```

---

# 8. 📌 FOLLOW-UP SUMMARY

```
+--------------------------------------------------------------------------------------------------------+
|  Follow-up Summary                                                                                      |
|                                                                                                        |
|  Pending Follow-ups:       182                                                                         |
|  High Priority (Today):    36                                                                          |
|  Overdue Follow-ups:       54 (Red)                                                                    |
|  Completed Today:          89                                                                          |
+--------------------------------------------------------------------------------------------------------+
```

---

# 9. 📋 PENDING TASKS

```
+--------------------------------------------------------------------------------------------------------+
|  Pending Tasks                                                                                         |
|                                                                                                        |
|  • Approve 14 quotations from executives                                                               |
|  • Reassign leads for inactive executives                                                              |
|  • Review escalated customer complaints                                                                |
|  • Validate special commodity leads                                                                    |
|  • Audit overdue follow-ups                                                                            |
+--------------------------------------------------------------------------------------------------------+
```

---

# 10. 🟪 BOTTOM QUICK ACTION BAR

```
+--------------------------------------------------------------------------------------------------------+
|  [+ New Lead]   [Reassign Leads]   [View Special Leads]   [Export Zone Report]                        |
+--------------------------------------------------------------------------------------------------------+
```

---

# 11. 📘 FINAL ASCII BLUEPRINT

```
+========================================================================================================+
|                                       ZONAL MANAGER DASHBOARD                                         |
+========================================================================================================+

| HEADER (Gradient Banner)
|--------------------------------------------------------------------------------------------------------|
|  Hello <Name>, your zone performance at a glance.                                                      |
|  Actions:  [+ Assign Leads]  [View Approvals]  [Export Zone Report]                                   |
|--------------------------------------------------------------------------------------------------------|

| TOP KPI CARDS (4)
|--------------------------------------------------------------------------------------------------------|
|  [Total Leads]  [New Leads]  [Pending Approvals]  [Hot Leads]                                         |
|--------------------------------------------------------------------------------------------------------|

| ZONE SNAPSHOT
|--------------------------------------------------------------------------------------------------------|
|  [Leads Assigned Today]       [Follow-ups Due Today]                                                  |
|  [Conversions Today]          [Escalations Raised]                                                    |
|--------------------------------------------------------------------------------------------------------|

| LEAD AGING
|--------------------------------------------------------------------------------------------------------|
|  0–7 days    ████████████████████████████                                                              |
|  8–15 days   ██████████████████                                                                        |
|  16–30 days  ██████████                                                                                |
|  30+ days    █████                                                                                        |
|--------------------------------------------------------------------------------------------------------|

| EXECUTIVE PERFORMANCE
|--------------------------------------------------------------------------------------------------------|
|  <Exec 1>    █████████████████████████████████   78 Leads Closed                                      |
|  <Exec 2>    ████████████████████                 62 Leads Closed                                      |
|  <Exec 3>    ██████████████                        38 Leads Closed                                     |
|  <Exec 4>    █████████                               24 Leads Closed                                    |
|--------------------------------------------------------------------------------------------------------|

| FOLLOW-UP SUMMARY
|--------------------------------------------------------------------------------------------------------|
|  Pending: 182 | High Priority: 36 | Overdue: 54 | Completed Today: 89                                 |
|--------------------------------------------------------------------------------------------------------|

| PENDING TASKS
|--------------------------------------------------------------------------------------------------------|
|  • Approve quotations                                                                                  |
|  • Reassign leads                                                                                      |
|  • Validate special leads                                                                               |
|  • Check escalations                                                                                   |
|  • Audit overdue follow-ups                                                                            |
|--------------------------------------------------------------------------------------------------------|

| QUICK ACTION BAR (Bottom)
|--------------------------------------------------------------------------------------------------------|
|  [+ New Lead]   [Reassign Leads]   [View Special Leads]   [Export Zone Report]                        |
+========================================================================================================+
```

---

**End of File: zonal manager.md**
