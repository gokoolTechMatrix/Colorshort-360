# STORE MANAGER DASHBOARD -- UI BLUEPRINT

Role: **Store Manager** (ERP + CRM -- Inventory, Procurement, Spares
Flow)\
Purpose: Daily store operations, PO management, stock control, spare
requests, GRN, returns, transfers.

## 1. PAGE HEADER

### Structure

-   Page Title
-   Subtitle (role context)
-   Global Search (SKU / PO / GRN / Spare)
-   Quick CTA

``` jsx
<header className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold">Store Manager Dashboard</h1>
    <p className="text-gray-500">Inventory • Spares • Procurement • Service Spares Flow</p>
  </div>

  <div className="flex gap-3">
    <input type="search" placeholder="Search Spare / SKU / PO" className="input" />
    <button className="btn-primary">Create Purchase Order</button>
  </div>
</header>
```

## 2. PRIMARY KPI CARDS

``` jsx
<section className="grid grid-cols-4 gap-4 mb-8">
  <Card title="Total Stock Items" value="1,248" trend="+12%" />
  <Card title="Low Stock Alerts" value="17" trend="Critical" />
  <Card title="Pending Purchase Orders" value="6" trend="Due this week" />
  <Card title="Pending Spare Requests" value="9" trend="From Service Dept" />
</section>
```

## 3. SECONDARY KPI CARDS

``` jsx
<section className="grid grid-cols-4 gap-4 mb-8">
  <CardSmall label="Today’s GRN" value="3" />
  <CardSmall label="Today’s Issues" value="14" />
  <CardSmall label="Today’s Returns" value="2" />
  <CardSmall label="Warehouse Transfers" value="4" />
</section>
```

## 4. NAVIGATION CARDS

``` jsx
<section className="grid grid-cols-4 gap-6">
  <NavCard icon="box" title="Inventory Overview" desc="Stock, valuation, adjustments" />
  <NavCard icon="layers" title="Spare Parts" desc="Issue, return, tracking" />
  <NavCard icon="truck" title="Purchase Orders" desc="Create & track POs" />
  <NavCard icon="download" title="GRN – Goods Receipt" desc="Record incoming stock" />
  <NavCard icon="upload" title="Stock Issue" desc="Issue spares to service" />
  <NavCard icon="refresh-ccw" title="Returns & Replacement" desc="Return damaged items" />
  <NavCard icon="git-branch" title="Warehouse Transfer" desc="Inter-store transfers" />
  <NavCard icon="alert-triangle" title="Stock Alerts" desc="Low stock notifications" />
</section>
```

## 5. QUICK ACTIONS

``` jsx
<section className="mt-8 flex gap-4">
  <QuickAction label="Create PO" icon="plus" />
  <QuickAction label="Record GRN" icon="check" />
  <QuickAction label="Issue Spare" icon="send" />
  <QuickAction label="Return Entry" icon="rotate-ccw" />
  <QuickAction label="Add New Item" icon="package-plus" />
</section>
```

## 6. TABLE SECTIONS

### Pending Spare Requests

``` jsx
<Table
  title="Pending Spare Requests"
  columns={["Request ID", "Ticket No", "Item", "Qty", "Requested By", "Status", "Action"]}
/>
```

### Incoming GRN Queue

``` jsx
<Table
  title="Incoming GRN / Supplier Deliveries"
  columns={["GRN No", "Supplier", "Items", "Qty", "Expected Date", "Action"]}
/>
```

### Low Stock Alerts

``` jsx
<Table
  title="Low Stock Alerts"
  columns={["SKU", "Item", "Available", "Reorder Level", "Last Purchase", "Action"]}
/>
```

### Pending Purchase Orders

``` jsx
<Table
  title="Pending Purchase Orders"
  columns={["PO No", "Supplier", "Date", "Value", "Status", "Action"]}
/>
```

## 7. INVENTORY INSIGHTS PANEL

``` jsx
<SidePanel title="Inventory Insights">
  <ListItem label="Top Moving Item" value="Sensor Board - 320 units" />
  <ListItem label="Slow Moving" value="PCB Tray - 6 units" />
  <ListItem label="Supplier Delay Alerts" value="2 Pending" />
</SidePanel>
```

## 8. NOTIFICATIONS PANEL

``` jsx
<NotificationPanel />
```

## 9. FOOTER

``` jsx
<footer className="text-center text-gray-400 mt-12">
  © 2025 TechMatrix AI — Store Management Suite
</footer>
```
