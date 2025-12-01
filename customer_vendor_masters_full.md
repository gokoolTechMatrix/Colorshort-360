# Customer & Vendor Masters — Feature Spec

> **Purpose:** This document describes the Customer & Vendor Masters feature for the Foundation app. It is written as a developer-friendly reference so you (or Codex) can implement a production-grade page with UI, backend, validations, APIs, and testing considerations.

---

## Table of contents
1. Overview
2. Data model & schema (SQL + JSON examples)
3. Required fields (form layout)
4. Optional / advanced fields
5. UI screens and interactions (detailed)
6. API endpoints (request/response examples)
7. Validations, business rules & UX notes
8. Import / Export behaviour
9. Permissions & roles
10. Security & compliance
11. Developer notes (indexing, pagination, background jobs)
12. Accessibility & testing checklist
13. Sample payloads & SQL statements

---

## 1. Overview
Implement a unified **Master** entity for both customers and vendors. Use a `type` flag to mark `customer`, `vendor`, or `both`. Keep forms modular: Identity → Contacts → Addresses → Financial → Tax & Documents → Metadata.

Design goals:
- Single source of truth for parties (customers/vendors) to avoid duplication.
- Fast searchable list with filters and server-side pagination.
- Secure handling of financial data (masking/encryption).
- Extensible model using `custom_fields` for client-specific needs.

---

## 2. Data model & schema

### Core table (SQL)
```sql
CREATE TABLE masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(16) NOT NULL, -- 'customer'|'vendor'|'both'
  status VARCHAR(32) DEFAULT 'active',
  industry VARCHAR(128),
  currency CHAR(3) DEFAULT 'INR',
  credit_limit NUMERIC(18,2) DEFAULT 0,
  tax_id VARCHAR(64),
  tax_country CHAR(2),
  tags TEXT[],
  custom_fields JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE
);
```

### Contacts table
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES masters(id),
  name VARCHAR(255),
  role VARCHAR(128),
  email VARCHAR(255),
  phone VARCHAR(32),
  is_primary BOOLEAN DEFAULT FALSE
);
```

### Addresses table
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES masters(id),
  label VARCHAR(64),
  line1 VARCHAR(255), line2 VARCHAR(255),
  city VARCHAR(128), state VARCHAR(128),
  postal_code VARCHAR(32), country CHAR(2),
  is_primary BOOLEAN DEFAULT FALSE,
  lat NUMERIC, lon NUMERIC
);
```

### Bank accounts table
```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES masters(id),
  bank_name VARCHAR(255),
  account_number_encrypted TEXT,
  account_mask VARCHAR(32),
  ifsc VARCHAR(64),
  currency CHAR(3)
);
```

### Documents
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES masters(id),
  doc_type VARCHAR(64),
  file_url TEXT,
  metadata JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

---

## 3. Required fields

### Step 1 — Identity
- Code (required, unique)
- Name (required)
- Type (customer/vendor/both)
- Status (active/inactive/prospect/suspended)
- Industry

### Step 2 — Primary Contact
- Name
- Phone (E.164)
- Email
- Preferred communication

### Step 3 — Addresses
- Label
- Line1, Line2, City, State, Postal code, Country
- Primary address toggle

### Step 4 — Financial
- Currency
- Credit limit
- Billing terms
- Payment methods
- Bank details (repeatable)

### Step 5 — Tax & Compliance
- Tax ID
- Tax registration country
- Tax exempt + reason
- Document uploads

### Step 6 — Metadata
- Tags
- Custom fields
- Account owner

---

## 4. Optional / Advanced fields
- Annual revenue
- Number of employees
- SLA
- Onboarding status
- ERP sync fields
- Pricing tier
- Discount group
- Preferred shipper

---

## 5. UI screens

### Master List / Grid
- Search, filters (type, status, city, industry)
- Server pagination
- Columns: Code, Name, Type, Primary Contact, City, Status, Credit Limit, Tax ID
- Row actions: view, edit, deactivate, export

### Master Detail Page
Tabs:
- Overview
- Contacts
- Addresses
- Financial
- Tax & Documents
- Audit log

### Create/Edit Flow
- Stepper UI
- Field-level validation
- Save as draft
- Review page before submit

---

## 6. API Endpoints

### List
```
GET /api/masters?type=vendor&status=active&search=acme&page=1&pageSize=25
```

### Get by ID
```
GET /api/masters/{id}
```

### Create
```json
POST /api/masters
{
  "code": "ACME-001",
  "name": "Acme Corp",
  "type": "customer",
  "contacts": [{
    "name": "Ravi",
    "email": "ravi@acme.com",
    "phone": "+919876543210",
    "is_primary": true
  }],
  "addresses": [{
    "label": "Billing",
    "line1": "...",
    "city": "Chennai",
    "country": "IN",
    "is_primary": true
  }],
  "currency": "INR",
  "credit_limit": 1000000,
  "tax_id": "33AAAAA0000A1Z5",
  "custom_fields": { "onboarding_batch": "2025-Q3" }
}
```

### Update
```
PUT /api/masters/{id}
PATCH /api/masters/{id}
```

### Import
```
POST /api/masters/import
```

### Export
```
GET /api/masters/export?type=customer&status=active&format=csv
```

---

## 7. Validations & Business Rules
- Unique code
- Unique tax ID per country
- Full phone & email validation
- Mask bank account fields
- Prevent deactivation if active transactions exist
- Compliance document expiry warning
- Draft mode supported

---

## 8. Import/Export
- CSV/XLSX template
- Row-level error report
- Background job for imports
- Filtered exports with selected columns

---

## 9. Permissions
Roles:
- Admin
- Finance
- Procurement
- Sales
- ReadOnly

Finance-only access to bank details.  
Admin-only delete & override actions.

---

## 10. Security & Compliance
- Encrypt bank accounts
- Presigned URLs for documents
- Complete audit log (before/after values)
- PII retention policy support

---

## 11. Developer notes
- Add indexes: code, name, tax_id, status
- Cursor pagination recommended
- Background workers for heavy processes
- Feature flags for optional modules

---

## 12. Accessibility & Testing
- Keyboard navigation
- ARIA labels for stepper
- High contrast states
- Unit, integration, E2E tests
- Document upload & download tests

---

## 13. Sample payloads

### Create payload
```json
{
  "code": "ACME-001",
  "name": "Acme Corporation",
  "type": "customer",
  "status": "active",
  "contacts": [{
    "name": "Ravi Kumar",
    "email": "ravi@acme.com",
    "phone": "+919876543210",
    "is_primary": true
  }],
  "addresses": [{
    "label": "Billing",
    "line1": "12 MG Road",
    "city": "Chennai",
    "state": "TN",
    "postal_code": "600001",
    "country": "IN",
    "is_primary": true
  }],
  "currency": "INR",
  "credit_limit": 500000,
  "tax_id": "33AAAAA0000A1Z5",
  "custom_fields": { "onboarding_batch": "2025-Q3" }
}
```

---

# End of document
