export const EMAIL_ROLE_MAP: Record<string, string> = {
  "8956235623@gmail.com": "store-incharge",
  "9874561230@gmail.com": "purchase-manager",
  "6379044546@gmail.com": "service-co-ordinator",
  "9965572625@gmail.com": "sales-co-ordinator",
  "6381590969@gmail.com": "accountant",
  "8667785533@gmail.com": "service-engineer",
  "8754112286@gmail.com": "sales-executive",
  "9042160564@gmail.com": "service-manager",
};

export const getRoleFromEmail = (email?: string | null) => {
  if (!email) return undefined;
  return EMAIL_ROLE_MAP[email.toLowerCase()];
};
