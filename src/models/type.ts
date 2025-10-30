export type Offer = {
  id?: string;
  name: string;
  value_props: string[];
  ideal_use_cases: string[]; // e.g. ["B2B SaaS mid-market"]
  created_at?: string;
};

export type LeadRaw = {
  name: string;
  role: string;
  company: string;
  industry: string;
  location: string;
  linkedin_bio?: string;
};

export type LeadScored = LeadRaw & {
  intent?: "High" | "Medium" | "Low";
  score?: number;
  reasoning?: string;
};
