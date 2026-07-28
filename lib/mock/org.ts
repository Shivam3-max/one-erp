import type { Tenant, User, Customer } from "../types";

export const TENANT: Tenant = {
  id: "T-CANDRON",
  name: "CANDRON Electricals Pvt. Ltd.",
  code: "CANDRON",
  logoText: "CANDRON",
  primaryCurrency: "INR",
  country: "India",
};

export const USERS: User[] = [
  { id: "U-01", tenantId: TENANT.id, name: "Arjun Mehta", initials: "AM", role: "Sales Head", department: "sales", email: "arjun@candron.in" },
  { id: "U-02", tenantId: TENANT.id, name: "Priya Nair", initials: "PN", role: "Application Engineer", department: "application-engineering", email: "priya@candron.in" },
  { id: "U-03", tenantId: TENANT.id, name: "Rakesh Iyer", initials: "RI", role: "Design Engineer", department: "design-engineering", email: "rakesh@candron.in" },
  { id: "U-04", tenantId: TENANT.id, name: "Sneha Kulkarni", initials: "SK", role: "Estimation Lead", department: "estimation", email: "sneha@candron.in" },
  { id: "U-05", tenantId: TENANT.id, name: "Vikram Rao", initials: "VR", role: "Commercial Head", department: "commercial", email: "vikram@candron.in" },
  { id: "U-06", tenantId: TENANT.id, name: "Deepa Menon", initials: "DM", role: "Procurement Manager", department: "procurement", email: "deepa@candron.in" },
  { id: "U-07", tenantId: TENANT.id, name: "Suresh Patil", initials: "SP", role: "Production Manager", department: "manufacturing", email: "suresh@candron.in" },
  { id: "U-08", tenantId: TENANT.id, name: "Anil Kumar", initials: "AK", role: "Testing Engineer", department: "quality", email: "anil@candron.in" },
  { id: "U-09", tenantId: TENANT.id, name: "Meera Shah", initials: "MS", role: "Director", department: "management", email: "meera@candron.in" },
];

export const CURRENT_USER = USERS[8]; // Director view — sees everything

export const CUSTOMERS: Customer[] = [
  { id: "C-01", tenantId: TENANT.id, name: "Maharashtra State Electricity Distribution Co.", type: "utility", city: "Mumbai", state: "Maharashtra", country: "India", gstin: "27AAECM1234A1Z5", rating: "A", since: "2019-04-12" },
  { id: "C-02", tenantId: TENANT.id, name: "Tata Projects Ltd.", type: "epc", city: "Hyderabad", state: "Telangana", country: "India", gstin: "36AAACT2803M1ZW", rating: "A", since: "2020-08-03" },
  { id: "C-03", tenantId: TENANT.id, name: "UltraTech Cement Ltd.", type: "industrial", city: "Mumbai", state: "Maharashtra", country: "India", gstin: "27AAACL6442L1ZM", rating: "A", since: "2021-01-20" },
  { id: "C-04", tenantId: TENANT.id, name: "Gujarat Energy Transmission Corp. (GETCO)", type: "utility", city: "Vadodara", state: "Gujarat", country: "India", gstin: "24AAACG8896R1Z0", rating: "A", since: "2018-11-05" },
  { id: "C-05", tenantId: TENANT.id, name: "L&T Construction", type: "epc", city: "Chennai", state: "Tamil Nadu", country: "India", gstin: "33AAACL0140P1Z8", rating: "A", since: "2019-06-18" },
  { id: "C-06", tenantId: TENANT.id, name: "JSW Steel Ltd.", type: "industrial", city: "Bellary", state: "Karnataka", country: "India", gstin: "29AAACJ4323N1ZS", rating: "A", since: "2020-02-14" },
  { id: "C-07", tenantId: TENANT.id, name: "Adani Electricity Mumbai Ltd.", type: "utility", city: "Mumbai", state: "Maharashtra", country: "India", gstin: "27AAECA5088R1ZE", rating: "B", since: "2021-09-30" },
  { id: "C-08", tenantId: TENANT.id, name: "NTPC Ltd.", type: "government", city: "New Delhi", state: "Delhi", country: "India", gstin: "07AAACN0255D1Z6", rating: "A", since: "2017-03-22" },
  { id: "C-09", tenantId: TENANT.id, name: "Sterlite Power Transmission Ltd.", type: "epc", city: "Gurugram", state: "Haryana", country: "India", gstin: "06AAKCS5678H1Z2", rating: "A", since: "2022-05-11" },
  { id: "C-10", tenantId: TENANT.id, name: "Siemens Energy GmbH", type: "export", city: "Munich", state: "Bavaria", country: "Germany", rating: "A", since: "2021-11-08" },
];

export const userById = (id: string) => USERS.find((u) => u.id === id) ?? USERS[0];
export const customerById = (id: string) => CUSTOMERS.find((c) => c.id === id) ?? CUSTOMERS[0];
