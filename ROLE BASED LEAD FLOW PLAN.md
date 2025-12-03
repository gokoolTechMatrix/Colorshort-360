ROLE BASED LEAD FLOW PLAN:


Here’s a simple way to spin up role-specific lead pages:
---

###### 

###### Routing layout

###### Create per-role routes: e.g. src/app/lead-management/sales-executive/page.tsx, .../service-engineer/page.tsx, etc.

###### Add a thin router at src/app/lead-management/page.tsx that reads the user role (from Supabase session or your existing role slug) and does router.replace(/lead-management/${roleSlug}).

###### Role detection

###### Preferred: use Supabase session (e.g. supabase.auth.getSession() and user.user\_metadata.role or your /api/user-role endpoint). Fallbacks can be your current localStorage role slug if needed.

###### Normalize roles to slugs (lowercase, hyphenated) so file paths match.

###### Page scaffolding

###### Copy the sales-executive page as a starter into the new route file, strip the sales-specific UI, and leave a clear blank state for that role (e.g. “Lead management for Service Engineer coming soon”).

###### Keep the header/brand consistent; swap KPIs and lists for that role’s data once you design it.

###### Remove the access-deny check from the role-specific page (it’s already enforced in the router).

###### Shared pieces

###### Extract reusable bits (gradient header, KPI card component, list item component, toast) into components/lead so each role page composes them with its own data and colors.

###### Keep mock data per role in the page until you wire to real APIs.

###### Navigation

###### Ensure sidebar links point to the role-specific path. When the role is unknown or unsupported, show a neutral “not available yet” screen.

###### If you’d like, I can: (a) add the router in /lead-management/page.tsx, (b) scaffold a blank service-engineer page with the shared header, and (c) move the shared header/KPI components into components/lead/.

