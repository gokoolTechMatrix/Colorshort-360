# Spare Request Approval Flow – Inventory & Service Integration

Project: ColorSort360 (TechMatrix AI)  
Module: Service → Inventory (Spare Request)  
Version: v1.0  
Last Updated: YYYY-MM-DD  

---

## 1. Purpose

This document defines the **end-to-end workflow** for handling **spare part requests** raised from the Service side and fulfilled by the Inventory team.

Goal:

- Ensure **clear ownership** at each step (Service Engineer → Service Coordinator → Service Manager → Store Incharge → Store Manager [optional]).
- Make the flow **implementable in ERP** without confusion.
- Support **high-value spare control** via optional Store Manager approval.

---

## 2. Actors / Roles

### 2.1 Service Side

- **Service Engineer (SE)**
  - Raises spare request based on service ticket.
  - Provides technical reason, machine details, and urgency.

- **Service Coordinator (SC)**
  - Validates request details.
  - Checks duplication, correctness, and service ticket linkage.
  - Can reject or forward to Service Manager.

- **Service Manager (SM)**
  - Final approver from Service department side.
  - Validates: warranty, AMC, cost impact, and necessity.
  - Approves or rejects the spare request.

### 2.2 Inventory Side

- **Store Incharge (SI)**
  - First receiver of approved spare request from SM.
  - Responsible for:
    - Picking stock.
    - Issuing spare.
    - Updating inventory quantities.
    - Preparing Delivery Challan (DC) and dispatch details.

- **Store Manager (STM)** (Optional Approval)
  - Approves only for:
    - High-value spares.
    - Restricted / critical items.
  - Can approve or reject before Store Incharge issues.

---

## 3. Core Entity & Status Model

### 3.1 Entity: `SpareRequest`

Mandatory fields (minimum):

- `id`
- `service_ticket_id`
- `customer_id`
- `machine_id` (optional but recommended)
- `requested_by_id` (Service Engineer)
- `requested_role` (always `SERVICE_ENGINEER`)
- `requested_on` (timestamp)
- `spare_items` (array):
  - `spare_id`
  - `qty`
  - `uom`
  - `is_high_value` (bool)
- `reason` (text)
- `priority` (Low / Normal / High)
- `current_status`
- `current_owner_role`
- `current_owner_id`

### 3.2 Suggested Status Values

- `DRAFT` – created but not submitted (optional).
- `PENDING_SC_REVIEW` – waiting for Service Coordinator.
- `REJECTED_BY_SC`
- `PENDING_SM_APPROVAL`
- `REJECTED_BY_SM`
- `PENDING_STORE_INCHARGE`
- `PENDING_STORE_MANAGER` (if high-value / restricted).
- `REJECTED_BY_STORE_MANAGER`
- `APPROVED_FOR_ISSUE`
- `ISSUED` – spare issued & inventory updated.
- `CANCELLED` – manually cancelled.

---

## 4. High-Level Workflow

### 4.1 Step-by-Step Flow

1. **Spare Request Raised (Service Engineer)**
   - SE selects:
     - Service Ticket
     - Machine
     - Customer
   - Adds:
     - Required spares (line items)
     - Quantity
     - Reason / Problem description
     - Priority (Normal/High)
   - Clicks **“Submit for Review”**.
   - System sets:
     - `current_status = PENDING_SC_REVIEW`
     - `current_owner_role = SERVICE_COORDINATOR`

2. **Validation (Service Coordinator)**
   - SC sees all **pending requests** assigned to them.
   - Validates:
     - Correct ticket mapping.
     - Reason is meaningful.
     - No duplicate spare request already open.
   - If **invalid / unclear**:
     - Adds remarks.
     - Sets `current_status = REJECTED_BY_SC`
     - System notifies SE.
   - If **valid**:
     - Forwards to SM.
     - `current_status = PENDING_SM_APPROVAL`
     - `current_owner_role = SERVICE_MANAGER`

3. **Final Approval (Service Manager)**
   - SM reviews:
     - Ticket history.
     - AMC / Warranty status.
     - Cost impact / part type.
   - If **rejected**:
     - `current_status = REJECTED_BY_SM`
     - System notifies SC & SE.
   - If **approved**:
     - `current_status = PENDING_STORE_INCHARGE`
     - `current_owner_role = STORE_INCHARGE`
     - System notifies Store Incharge.

4. **Inventory Handling – Store Incharge**

   The request now arrives to **Store Incharge**.

   - SI checks:
     - Availability of each spare.
     - Reserved stock vs free stock.
   - System evaluates each line:
     - If `is_high_value = false` → no Store Manager approval needed.
     - If `is_high_value = true` → Store Manager approval required.

   #### 4.4.1 Normal Spare (Not High-Value)
   - SI:
     - Picks stock.
     - Confirms quantity & batch/serial (if required).
     - Prepares **Delivery Challan** / internal issue note.
   - System:
     - Deducts stock from warehouse.
     - Links issue to `service_ticket_id`.
     - Sets:
       - `current_status = ISSUED`
       - `current_owner_role = NONE` (or system)
   - Notifications:
     - Service Coordinator + Service Engineer get **“Spare ready / dispatched”** alert.

   #### 4.4.2 High-Value / Restricted Spare
   - SI forwards to Store Manager:
     - `current_status = PENDING_STORE_MANAGER`
     - `current_owner_role = STORE_MANAGER`
   - Store Manager reviews:
     - Available stock.
     - Value & importance.
     - Any restrictions.
   - If **Store Manager rejects**:
     - `current_status = REJECTED_BY_STORE_MANAGER`
     - System notifies SI, SC, SE.
   - If **Store Manager approves**:
     - Returns request to SI:
       - `current_status = APPROVED_FOR_ISSUE`
       - `current_owner_role = STORE_INCHARGE`
     - SI issues spare:
       - Updates stock.
       - Prepares DC.
       - System sets `current_status = ISSUED`.

---

## 5. Mermaid Flowchart (For Diagrams)

> You can paste this in tools that support Mermaid (GitHub, some MD editors, Obsidian, etc.)

```mermaid
flowchart LR
    A["Service Engineer Raises Spare Request"] --> B["Service Coordinator Reviews Request"]
    B -->|Valid| C["Forward to Service Manager"]
    B -->|Invalid| Z["Reject and Return to Service Engineer"]

    C -->|Approve| D["Service Manager Approves Request"]
    C -->|Reject| Z

    D --> E["Redirect to Store Incharge"]

    E --> F{"High-Value Spare?"}
    F -->|No| G["Store Incharge Issues Spare and Updates Stock"]
    F -->|Yes| H["Store Manager Approval Required"]

    H -->|Approve| G
    H -->|Reject| Z

    G --> I["Update Inventory System and Notify Service Team"]
