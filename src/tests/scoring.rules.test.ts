import { ruleScoreForLead } from "../services/scoring";
import { Offer, LeadRaw } from "../models/type";

const offer: Offer = {
  name: "AI Outreach Automation",
  value_props: ["24/7 outreach", "6x more meetings"],
  ideal_use_cases: ["B2B SaaS mid-market"]
};

test("decision maker + exact industry + complete data", () => {
  const lead: LeadRaw = {
    name: "Ava",
    role: "Head of Growth",
    company: "FlowMetrics",
    industry: "B2B SaaS mid-market",
    location: "San Francisco",
    linkedin_bio: "growth leader"
  };

  const { ruleScore } = ruleScoreForLead(lead, offer);
  expect(ruleScore).toBe(50); // 20 role + 20 industry + 10 completeness
});

test("influencer + adjacent industry + missing field", () => {
  const lead: LeadRaw = {
    name: "Sam",
    role: "Growth Manager",
    company: "FlowMetrics",
    industry: "SaaS marketing agencies", // adjacent to B2B SaaS
    location: "",
    linkedin_bio: ""
  };

  const { ruleScore } = ruleScoreForLead(lead, offer);
  expect(ruleScore).toBe(20); // 10 role + 10 adjacent + 0 completeness
});
