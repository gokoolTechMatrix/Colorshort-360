# Sales Manager Dashboard — UI + Functionality

> This markdown file contains a ready-to-use UI & functionality specification for a **Sales Manager Dashboard**.
> Drop this file into your IDE for reference. The repository recommended structure and example React + Tailwind snippets are included.

---

## 1. Purpose
Create a Sales Manager dashboard that shows team-wide KPIs, pipeline, leaderboard, region/product performance, forecasts, alerts and manager actions (assign leads, approve discounts, export reports).

---

## 2. Recommended Tech Stack
- **Frontend:** React (Create React App / Vite / Next.js)  
- **Styling:** Tailwind CSS (recommended)  
- **State:** React Context + useReducer or Zustand/Redux  
- **Backend API:** Node.js / Express (sample endpoints included)  
- **DB:** MySQL / PostgreSQL / Supabase (optional)

---

## 3. Project Folder Structure
```
sales-manager-dashboard/
├─ public/
├─ src/
│  ├─ api/
│  │  └─ salesApi.js
│  ├─ components/
│  │  ├─ Header.jsx
│  │  ├─ KpiCards.jsx
│  │  ├─ TeamLeaderboard.jsx
│  │  ├─ Funnel.jsx
│  │  ├─ RegionHeatmap.jsx
│  │  ├─ ProductTable.jsx
│  │  ├─ ForecastCard.jsx
│  │  ├─ AlertsPanel.jsx
│  │  └─ ManagerActions.jsx
│  ├─ context/
│  │  └─ DashboardContext.jsx
│  ├─ pages/
│  │  └─ ManagerDashboard.jsx
│  ├─ data/
│  │  └─ sampleData.json
│  ├─ App.jsx
│  └─ index.css
├─ package.json
└─ README.md
```

---

## 4. Sample UI Layout (Desktop wireframe)
- **Left Sidebar:** Navigation (Dashboard, Reports, Clients, Products, Settings)  
- **Top Row:** Header with global filters (Date range, Region, Team)  
- **KPI Cards (row):** Total Leads, Follow-ups Due, Orders Won, Win Rate, Pipeline Value, Monthly Target %  
- **Team Leaderboard:** table with quick actions (message, reassign)  
- **Funnel:** conversion between stages with counts and %  
- **Region Heatmap / Map:** quick region performance  
- **Product Performance:** top products, revenue, margins  
- **Forecast & Alerts:** forecast card + manager alert list  
- **Manager Actions:** quick assign, approve discounts, export reports

---

## 5. Example React + Tailwind Components (simplified)

> These are minimal, copy-paste-ready building blocks. Adapt to your routing and state.

### `src/context/DashboardContext.jsx`
```jsx
import React, { createContext, useReducer, useContext } from "react";
import sampleData from "../data/sampleData.json";

const DashboardStateContext = createContext();
const DashboardDispatchContext = createContext();

const initialState = {
  filters: { startDate: null, endDate: null, region: "All" },
  data: sampleData,
  selectedTeamMember: null,
};

function reducer(state, action) {
  switch(action.type){
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "SET_DATA":
      return { ...state, data: action.payload };
    case "SELECT_MEMBER":
      return { ...state, selectedTeamMember: action.payload };
    default:
      return state;
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <DashboardStateContext.Provider value={state}>
      <DashboardDispatchContext.Provider value={dispatch}>
        {children}
      </DashboardDispatchContext.Provider>
    </DashboardStateContext.Provider>
  );
}

export const useDashboardState = () => useContext(DashboardStateContext);
export const useDashboardDispatch = () => useContext(DashboardDispatchContext);
```

### `src/components/KpiCards.jsx`
```jsx
import React from "react";
import { useDashboardState } from "../context/DashboardContext";

export default function KpiCards(){
  const { data } = useDashboardState();
  const totals = {
    leads: data.leads.length,
    followUpsDue: data.followUpsDue,
    ordersWon: data.ordersWon,
    winRate: data.winRate,
    pipelineValue: data.pipelineValue
  };
  return (
    <div className="grid grid-cols-6 gap-4">
      <div className="p-4 rounded-lg bg-white shadow">{totals.leads}<div className="text-sm">Total Leads</div></div>
      <div className="p-4 rounded-lg bg-white shadow">{totals.followUpsDue}<div className="text-sm">Follow-ups Due</div></div>
      <div className="p-4 rounded-lg bg-white shadow">{totals.ordersWon}<div className="text-sm">Orders Won</div></div>
      <div className="p-4 rounded-lg bg-white shadow">{totals.winRate}%<div className="text-sm">Win Rate</div></div>
      <div className="p-4 rounded-lg bg-white shadow">₹{totals.pipelineValue}<div className="text-sm">Pipeline Value</div></div>
      <div className="p-4 rounded-lg bg-white shadow">75%<div className="text-sm">Monthly Target</div></div>
    </div>
  );
}
```

### `src/components/TeamLeaderboard.jsx`
```jsx
import React from "react";
import { useDashboardState, useDashboardDispatch } from "../context/DashboardContext";

export default function TeamLeaderboard(){
  const { data } = useDashboardState();
  const dispatch = useDashboardDispatch();

  function assignLeadTo(memberId){
    dispatch({ type: "SELECT_MEMBER", payload: memberId });
    // open modal or call API to assign
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h3 className="font-semibold mb-3">Team Leaderboard</h3>
      <table className="w-full text-sm">
        <thead><tr><th>Name</th><th>Leads</th><th>Deals</th><th>Revenue</th><th>Action</th></tr></thead>
        <tbody>
          {data.team.map(m => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.leads}</td>
              <td>{m.deals}</td>
              <td>₹{m.revenue}</td>
              <td>
                <button onClick={()=>assignLeadTo(m.id)} className="px-2 py-1 rounded bg-indigo-500 text-white">Assign</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 6. Sample API Endpoints (Node + Express)
```
GET  /api/dashboard/summary        -> team summary
GET  /api/dashboard/team           -> team leaderboard
GET  /api/dashboard/funnel         -> funnel counts by stage
POST /api/leads/assign             -> { leadId, assigneeId }
POST /api/quotes/approve           -> { quoteId, approvedByManager: true }
GET  /api/reports/export?type=pdf  -> generate PDF/CSV
```

Example `salesApi.js` (frontend wrapper)
```js
export async function fetchSummary(){ return fetch("/api/dashboard/summary").then(r=>r.json()); }
export async function fetchTeam(){ return fetch("/api/dashboard/team").then(r=>r.json()); }
export async function assignLead(payload){ return fetch("/api/leads/assign",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json()); }
```

---

## 7. Sample Data (src/data/sampleData.json)
```json
{
  "leads": [{"id":1,"name":"Lead A"},{"id":2,"name":"Lead B"}],
  "followUpsDue": 9,
  "ordersWon": 24,
  "winRate": 28,
  "pipelineValue": 1235000,
  "team": [
    {"id": "t1", "name":"Naveen", "leads": 22, "deals": 3, "revenue": 480000},
    {"id": "t2", "name":"Anita", "leads": 18, "deals": 5, "revenue": 720000}
  ],
  "funnel": {"newLeads": 120, "contacted": 80, "quoteSent": 40, "negotiation": 12, "won": 8}
}
```

---

## 8. Manager Actions (Functional Requirements)
- Reassign lead: choose target executive and confirm (POST /api/leads/assign)  
- Approve quote/discount: manager accepts or rejects (POST /api/quotes/approve)  
- Set monthly target for executives (POST /api/targets/set)  
- Export selected reports (GET /api/reports/export)  
- Send broadcast messages to team (POST /api/messages/broadcast)  

---

## 9. Alerts & Business Rules
- **Stuck deals**: no activity in 7 days -> flag as "At Risk"  
- **Overdue follow-ups**: > 1 day overdue -> escalate to manager  
- **Unassigned leads**: any new lead unassigned for > 24 hours -> alert  
- **Discount approvals**: discounts > X% must be approved by manager

---

## 10. Running Locally (minimal steps)
1. `npx create-vite@latest sales-manager-dashboard --template react` or use CRA  
2. Install Tailwind: follow Tailwind docs to set up PostCSS & tailwind.config.js  
3. Copy `src/` files from this spec into your project.  
4. `npm install` and `npm run dev` (for vite) / `npm start` (for CRA)

---

## 11. Next steps & Enhancements
- Add charts with Recharts or Chart.js for trend lines  
- Add export to Excel/PDF using jsPDF / SheetJS  
- Add role-based auth (manager vs exec)  
- Add interactive map (leaflet) for region heatmap  
- Add realtime updates via WebSockets / Pusher / Supabase Realtime

---

## 12. License
Provided as-is for your project. Feel free to modify.

---
