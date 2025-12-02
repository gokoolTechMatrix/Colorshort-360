# Flow of Lead — Sales Manager Dashboard Design Guide

This document captures the structure, layout, and feature expectations that shaped the Sales Manager dashboard UI.

## Navigation & Layout
- Top bar: brand chip, page title/subtitle, date range filter (from/to), profile badge (name + role), sign-out.
- Tab set: Overview (default), Approvals, Order Sheets, Leads, Executives, Reports.
- Content container: soft gray background, white cards with rounded corners, subtle shadow; responsive grid for cards/tables.

## Overview Tab
- Pipeline metric cards (row of 6): New, Validated, Working, Quotation Sent, Quotation Approved, Ordered (code badge + count).
- Order Sheets Awaiting Verification: table with Order Sheet, Lead, Model, Qty, Total, Submitted By, Submitted On, Action (Review, Verify).
- Pending Approvals: table with Quotation, Lead, Model, Discount, Payment, Created, Action (Review link).
- Sales Executives snapshot: list of exec cards showing name initial, leads count, quotes, conversion, status button.

## Approvals Tab
- Quotations Awaiting Approval: table columns Quotation ID, Lead, Requested By, Model, Discount %, Payment, EMI, Created On, Action (Review).
- Recently Approved: table columns Quotation ID, Lead, Approved Model, Price, Requested By, Approved On.

## Order Sheets Tab
- Table replicating “Awaiting Verification” structure with Review/Verify actions.

## Leads Tab
- Search bar (right aligned). 
- Table columns: Client, Lead, Stage (pill), Priority (pill), Executive, Source, Created.

## Executives Tab
- Grid of executive cards: avatar initial, name, conversion %, stats pills (Leads, Quotes, Orders), status button.

## Reports Tab
- KPI tiles: Monthly target, Average conversion, Avg. response time, Discount approvals (gradient progress bar).
- Actions row: Export pipeline, Download approvals, View team report.

## Visual Language
- Palette: whites/soft grays background; indigo primary; emerald/amber accents for status; subtle gradients on tabs/buttons.
- Components: 12–32px radius, light borders, soft shadows; uppercase tracking for section metadata.
- Typography: bold headings, small caps for labels, consistent text-sm for table body, text-xs for meta.

## Data & Access Notes
- Mock data mirrors Qube Manager reference; replace with API feeds for pipeline metrics, approvals, orders, leads, execs, and reports.
- Actions (Review/Verify/Approve) are placeholders; wire to backend flows and role-based permissions.
