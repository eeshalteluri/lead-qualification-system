import { LeadRaw, LeadScored, Offer } from "../models/type";
import { askIntentClassification } from "./aiClient";

/**
 * Rule layer returns score (0-50) and short reasoning string.
 */
export function ruleScoreForLead(lead: LeadRaw, offer: Offer): { ruleScore: number; reasoning: string } {
  let score = 0;
  const reasoningParts: string[] = [];

  // Role relevance
  const roleLower = lead.role?.toLowerCase() || "";
  const decisionMakerKeywords = ["ceo", "founder", "co-founder", "chief", "head of", "vp ", "vice president", "director"];
  const influencerKeywords = ["manager", "lead", "principal", "senior", "growth", "marketing", "operations"];

  if (decisionMakerKeywords.some(k => roleLower.includes(k))) {
    score += 20;
    reasoningParts.push("role: decision maker (+20)");
  } else if (influencerKeywords.some(k => roleLower.includes(k))) {
    score += 10;
    reasoningParts.push("role: influencer (+10)");
  } else {
    reasoningParts.push("role: other (+0)");
  }

  // Industry match - exact or adjacent
  const leadIndustry = (lead.industry || "").toLowerCase();
  const icpList = offer.ideal_use_cases.map(i => i.toLowerCase()); // e.g. ["b2b saas mid-market"]
  let industryScore = 0;
  let industryReason = "industry: no match (+0)";

  for (const icp of icpList) {
    if (!icp) continue;
    if (leadIndustry === icp || leadIndustry.includes(icp) || icp.includes(leadIndustry)) {
      industryScore = 20;
      industryReason = `industry: exact ICP match (+20)`;
      break;
    }
  }

  if (industryScore === 0) {
    // adjacent heuristics: share tokens like "saas", "b2b", "mid-market", "marketing" etc.
    const leadTokens = new Set(leadIndustry.split(/\W+/));
    for (const icp of icpList) {
      const icpTokens = icp.split(/\W+/);
      const common = icpTokens.filter(t => leadTokens.has(t));
      if (common.length > 0) {
        industryScore = 10;
        industryReason = `industry: adjacent match (+10)`;
        break;
      }
    }
  }

  score += industryScore;
  reasoningParts.push(industryReason);

  // Data completeness
  const requiredFields = ["name", "role", "company", "industry", "location"];
  const hasAll = requiredFields.every(f => !!(lead as any)[f]);
  if (hasAll) {
    score += 10;
    reasoningParts.push("data completeness: all fields present (+10)");
  } else {
    reasoningParts.push("data completeness: missing fields (+0)");
  }

  return { ruleScore: score, reasoning: reasoningParts.join("; ") };
}

/**
 * Constructs the AI prompt for a single lead
 */
export function buildAIPrompt(lead: LeadRaw, offer: Offer): string {
  const leadBlock = `
Prospect:
Name: ${lead.name || "N/A"}
Role: ${lead.role || "N/A"}
Company: ${lead.company || "N/A"}
Industry: ${lead.industry || "N/A"}
Location: ${lead.location || "N/A"}
LinkedIn bio: ${lead.linkedin_bio || "N/A"}
`;

  const offerBlock = `
Offer / Product:
Name: ${offer.name}
Value props: ${offer.value_props.join(", ")}
Ideal use-cases: ${offer.ideal_use_cases.join(", ")}
`;

  const instruction = `
Task:
Given the prospect and the offer above, classify the prospect's buying intent as one of: High, Medium, Low.
Return a single-line JSON object EXACTLY in this format:
{"intent": "<High|Medium|Low>", "explanation": "<1-2 sentence explanation>"}
Do not output anything else. Explanation should be concise and grounded in the data provided.
`;

  return `${leadBlock}\n${offerBlock}\n${instruction}`;
}

/**
 * For mapping AI label to points:
 * High -> 50, Medium -> 30, Low -> 10
 */
export function aiLabelToPoints(label: string): number {
  const l = label?.toLowerCase();
  if (!l) return 10;
  if (l.includes("high")) return 50;
  if (l.includes("medium")) return 30;
  if (l.includes("low")) return 10;
  // fallback
  return 10;
}

/**
 * Full scoring pipeline for one lead.
 * Attempts AI call; if AI fails, fall back to rule-only (ai points = 0)
 */
export async function scoreLead(lead: LeadRaw, offer: Offer): Promise<LeadScored> {
  const { ruleScore, reasoning: ruleReason } = ruleScoreForLead(lead, offer);
  let aiPoints = 0;
  let aiIntent: "High" | "Medium" | "Low" = "Low";
  let aiExplanation = "";

  try {
    const prompt = buildAIPrompt(lead, offer);
    const aiResponse = await askIntentClassification(prompt, 150);
    // Expect JSON single-line like: {"intent": "High", "explanation": "Because ..."}
    let parsed: any = null;
    try {
      // Try to find JSON substring
      const jsonStart = aiResponse.indexOf("{");
      const jsonText = jsonStart >= 0 ? aiResponse.slice(jsonStart) : aiResponse;
      parsed = JSON.parse(jsonText);
    } catch (err) {
      // fallback: try simple extraction
      const lower = aiResponse.toLowerCase();
      if (lower.includes("high")) parsed = { intent: "High", explanation: aiResponse };
      else if (lower.includes("medium")) parsed = { intent: "Medium", explanation: aiResponse };
      else if (lower.includes("low")) parsed = { intent: "Low", explanation: aiResponse };
      else parsed = { intent: "Low", explanation: aiResponse };
    }

    aiIntent = (parsed.intent || "Low") as any;
    aiExplanation = parsed.explanation || aiResponse;
    aiPoints = aiLabelToPoints(aiIntent);
  } catch (err) {
    // AI failed: we log (not shown here) and continue with aiPoints = 0 (or choose fallback 10)
    aiPoints = 0; // keep fair: if AI couldn't be called, only rule score applies.
    aiExplanation = `AI layer failed: ${(err as Error).message}`;
  }

  const finalScore = Math.min(100, ruleScore + aiPoints);

  const leadScored: LeadScored = {
    ...lead,
    intent: aiIntent,
    score: finalScore,
    reasoning: `${ruleReason} | AI: ${aiIntent} - ${aiExplanation}`,
  };

  return leadScored;
}
