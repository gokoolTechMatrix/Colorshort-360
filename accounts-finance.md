# Accounts & Finance – Lead Management Role Document

## 🧾 Role Summary
The **Accounts & Finance** department is responsible for all financial activities after a lead is converted into an order.  
They do **not** participate in lead creation, editing, follow-up, or quotation approval.  
Their involvement begins **after the quotation is approved and order is generated**.

While they do not drive lead management activities, they rely on certain lead-level inputs for invoice creation, payment terms, EMI details, warranty/AMC billing, and customer finance information.

---

## 🎯 Core Responsibilities
- Generate invoices for Sales Orders.
- Validate PO details, payment terms, and delivery charges.
- Process and manage:
  - Advance payments
  - GST calculations
  - Credit notes
  - Debit notes
  - Ledger entries
- Verify EMI terms added during Quotation/Order creation.
- Manage Tally Prime Integration for:
  - e-Invoice generation  
  - e-Way bills (optional)  
- Track collections and outstanding payments.
- Update payment receipts against leads/orders.
- Provide financial clearance for installation scheduling (if payment pending).
- View customer financial history (linked to leads).

---

## 🔐 Access Permissions (Lead Management)

| Feature                          | Accounts & Finance Access                     |
|----------------------------------|-----------------------------------------------|
| View Lead List                   | ✔ Only Won leads / leads linked to Orders     |
| View Lead Detail                 | ✔ Read-only (financial info only)             |
| View Activities                  | ✖ No                                           |
| Add Activities                   | ✖ No                                           |
| Assign Lead                      | ✖ No                                           |
| Request Quotation                | ✖ No                                           |
| Approve Quotation                | ✖ No                                           |
| Close Lead                       | ✖ No                                           |
| Add Follow-up                    | ✖ No                                           |
| View Special Machine Leads       | ✔ Read-only (if needed for financial prep)    |
| View Customer Ledger             | ✔ Yes                                          |
| Generate Invoice                 | ✔ Yes (only Finance can do this)              |
| Approve Payment Receipt          | ✔ Yes                                          |
| Create Credit Note               | ✔ Yes                                          |
| Create Debit Note                | ✔ Yes                                          |
| Tally Integration (e-Invoice)    | ✔ Full Access                                  |
| Update Payment Status            | ✔ Yes                                          |

---

## 🧭 UI Functions
- **Invoices Dashboard**  
  - Create invoice  
  - Edit invoice  
  - Push to Tally  
  - Generate e-Invoice / QR Code  

- **Payment Receipt Page**  
  - Record payment  
  - Mode selection (UPI, Bank Transfer, Cheque/DD)  
  - Link to Sales Order  

- **Credit/Debit Note Page**  
  - Create new credit note  
  - Create new debit note  
  - Adjust against bill  

- **Ledger & Customer Finance Page**  
  - View financial history  
  - Outstanding amounts  
  - EMI schedule (if applicable)  

- **GST & Compliance Page**  
  - HSN/GST auto-calculations  
  - Tax summary  
  - E-way bill (future scope)  

---

## 🚫 Restrictions
- Cannot modify lead details.  
- Cannot assign or reassign leads.  
- Cannot approve or request quotations.  
- Cannot change lead stage (Won/Lost).  
- Cannot view internal sales follow-ups.  
- No contribution to lead activities or tasks.

---

## ⭐ Summary
The **Accounts & Finance** role only interacts with leads *after they convert into orders*.  
Their responsibilities revolve around:

- Invoicing  
- GST compliance  
- Payment receipt & financial tracking  
- Ledger management  
- Credit/Debit Notes  
- Tally Integration  

They play a **critical downstream role** but **zero direct influence** on the core Lead Management workflow.
