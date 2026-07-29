/** Shared between scripts/seed.ts and scripts/smoke.ts so they never drift. */
export const DEMO_USERS = [
  { email: "priya2027@cs.sjcetpalai.ac.in", displayName: "Priya Nair" },
  { email: "arjun2026@ec.sjcetpalai.ac.in", displayName: "Arjun Menon" },
  { email: "fathima2028@es.sjcetpalai.ac.in", displayName: "Fathima Rasheed" },
  { email: "admin@cs.sjcetpalai.ac.in", displayName: "Dr. Thomas Varghese" },
] as const;

export const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "CampusPulseDemo123!";
