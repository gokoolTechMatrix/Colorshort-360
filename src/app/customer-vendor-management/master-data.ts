export type MasterType = "customer" | "vendor" | "both";
export type MasterStatus = "active" | "inactive" | "prospect" | "suspended";
export type RiskLevel = "low" | "medium" | "high";
export type DocumentHealth = "valid" | "missing" | "expiring";

export type MasterRecord = {
  id: string;
  code: string;
  name: string;
  type: MasterType;
  status: MasterStatus;
  industry: string;
  city: string;
  country: string;
  creditLimit: number;
  currency: string;
  taxId: string;
  taxCountry: string;
  tags: string[];
  accountOwner: string;
  risk: RiskLevel;
  outstanding: number;
  lastUpdated: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    role: string;
    preferredCommunication: string;
  };
  address: {
    label: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isPrimary: boolean;
  };
  billingTerms: string;
  paymentMethods: string[];
  bankMask: string;
  documents: Array<{ type: string; status: DocumentHealth; note?: string }>;
};

export type Filters = {
  type: "all" | MasterType;
  status: "all" | MasterStatus;
  risk: "all" | RiskLevel;
  city: "all" | string;
  search: string;
};

export const MASTER_SEED: MasterRecord[] = [
  {
    id: "M-ACME",
    code: "ACME-001",
    name: "Acme Corporation",
    type: "customer",
    status: "active",
    industry: "Food Processing",
    city: "Chennai",
    country: "IN",
    creditLimit: 1000000,
    currency: "INR",
    taxId: "33AAAAA0000A1Z5",
    taxCountry: "IN",
    tags: ["priority", "gst-verified"],
    accountOwner: "Priya Raman",
    risk: "low",
    outstanding: 380000,
    lastUpdated: "2025-11-28T10:00:00Z",
    primaryContact: {
      name: "Ravi Kumar",
      email: "ravi@acme.com",
      phone: "+919876543210",
      role: "Procurement Lead",
      preferredCommunication: "email",
    },
    address: {
      label: "Billing",
      line1: "12 MG Road",
      city: "Chennai",
      state: "TN",
      postalCode: "600001",
      country: "IN",
      isPrimary: true,
    },
    billingTerms: "Net 30",
    paymentMethods: ["NEFT", "UPI"],
    bankMask: "HDFC ****8901",
    documents: [
      { type: "GST Certificate", status: "valid" },
      { type: "MSA", status: "expiring", note: "Renews in 25 days" },
    ],
  },
  {
    id: "M-V884",
    code: "VEND-884",
    name: "Delta Fabrication",
    type: "vendor",
    status: "active",
    industry: "Industrial Fabrication",
    city: "Coimbatore",
    country: "IN",
    creditLimit: 400000,
    currency: "INR",
    taxId: "29BBBBA0000B1Z1",
    taxCountry: "IN",
    tags: ["preferred-vendor", "sla"],
    accountOwner: "Naveen B",
    risk: "medium",
    outstanding: 120000,
    lastUpdated: "2025-11-26T09:00:00Z",
    primaryContact: {
      name: "Sangeetha M",
      email: "ops@deltafab.com",
      phone: "+919980011223",
      role: "Account Manager",
      preferredCommunication: "phone",
    },
    address: {
      label: "Operations",
      line1: "Plot 22, Industrial Estate",
      city: "Coimbatore",
      state: "TN",
      postalCode: "641045",
      country: "IN",
      isPrimary: true,
    },
    billingTerms: "Net 45",
    paymentMethods: ["RTGS", "Cheque"],
    bankMask: "SBI ****1199",
    documents: [
      { type: "PAN", status: "valid" },
      { type: "Bank Proof", status: "missing", note: "Awaiting upload" },
    ],
  },
  {
    id: "M-B210",
    code: "BOTH-210",
    name: "Harvest Hub",
    type: "both",
    status: "prospect",
    industry: "Agri Trading",
    city: "Pune",
    country: "IN",
    creditLimit: 750000,
    currency: "INR",
    taxId: "27CCCCC0000C1Z2",
    taxCountry: "IN",
    tags: ["onboarding", "demo"],
    accountOwner: "Gokul K",
    risk: "medium",
    outstanding: 0,
    lastUpdated: "2025-11-24T15:00:00Z",
    primaryContact: {
      name: "Divya Singh",
      email: "divya@harvesthub.com",
      phone: "+918826009900",
      role: "Finance Lead",
      preferredCommunication: "email",
    },
    address: {
      label: "Head Office",
      line1: "5 Residency Road",
      city: "Pune",
      state: "MH",
      postalCode: "411001",
      country: "IN",
      isPrimary: true,
    },
    billingTerms: "Net 30",
    paymentMethods: ["UPI", "NEFT"],
    bankMask: "ICICI ****4410",
    documents: [
      { type: "GST Certificate", status: "missing", note: "Upload required" },
      { type: "NDA", status: "valid" },
    ],
  },
  {
    id: "M-S321",
    code: "SUP-321",
    name: "Skyline Logistics",
    type: "vendor",
    status: "suspended",
    industry: "Logistics",
    city: "Hyderabad",
    country: "IN",
    creditLimit: 250000,
    currency: "INR",
    taxId: "36DDDDD0000D1Z7",
    taxCountry: "IN",
    tags: ["compliance-hold"],
    accountOwner: "Myura V",
    risk: "high",
    outstanding: 45000,
    lastUpdated: "2025-11-20T11:30:00Z",
    primaryContact: {
      name: "Karthik Rao",
      email: "karthik@skyline.in",
      phone: "+919900123456",
      role: "Ops Lead",
      preferredCommunication: "phone",
    },
    address: {
      label: "Registered",
      line1: "18 Jubilee Enclave",
      city: "Hyderabad",
      state: "TS",
      postalCode: "500081",
      country: "IN",
      isPrimary: true,
    },
    billingTerms: "Prepaid",
    paymentMethods: ["UPI"],
    bankMask: "AXIS ****7002",
    documents: [
      { type: "Compliance Pack", status: "expiring", note: "Renew KYC" },
      { type: "Insurance", status: "missing", note: "Upload certificate" },
    ],
  },
  {
    id: "M-C999",
    code: "CUST-999",
    name: "Northwind Agro",
    type: "customer",
    status: "prospect",
    industry: "Rice Mills",
    city: "Jaipur",
    country: "IN",
    creditLimit: 500000,
    currency: "INR",
    taxId: "08EEEEE0000E1Z8",
    taxCountry: "IN",
    tags: ["trial", "pricing-tier-2"],
    accountOwner: "Sales Manager",
    risk: "low",
    outstanding: 0,
    lastUpdated: "2025-11-25T08:00:00Z",
    primaryContact: {
      name: "Mohan Lal",
      email: "mohan@northwind.in",
      phone: "+919801112233",
      role: "Owner",
      preferredCommunication: "email",
    },
    address: {
      label: "Mill",
      line1: "2/14 Industrial Area",
      city: "Jaipur",
      state: "RJ",
      postalCode: "302001",
      country: "IN",
      isPrimary: true,
    },
    billingTerms: "Advance 20% / Net 30",
    paymentMethods: ["NEFT", "UPI"],
    bankMask: "Kotak ****9911",
    documents: [
      { type: "GST Certificate", status: "valid" },
      { type: "KYC", status: "expiring", note: "Refresh in 15 days" },
    ],
  },
];
