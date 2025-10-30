import { Request, Response } from "express";
import { storage } from "../services/storage";
import { scoreLead } from "../services/scoring";
import { stringify } from "csv-stringify/sync";
import { LeadScored } from "../models/type";

export const runScoring = async (req: Request, res: Response) => {
  const offer = storage.getOffer();
  if (!offer) return res.status(400).json({ error: "No offer stored. POST /offer first." });

  const leads = storage.getLeads();
  if (!leads || leads.length === 0) return res.status(400).json({ error: "No leads uploaded. POST /leads/upload." });

  const results = [];
  for (const lead of leads) {
    try {
      const scored = await scoreLead(lead, offer);
      results.push(scored);
    } catch (err) {
      // handle per-lead failure gracefully, include fallback
      results.push({
        ...lead,
        intent: "Low",
        score: 0,
        reasoning: "Failed to score: " + (err as Error).message
      } as LeadScored);
    }
  }

  storage.setScored(results);
  return res.json({ counted: results.length, results });
};

export const getResults = (req: Request, res: Response) => {
  return res.json(storage.getScored());
};

// CSV export
export const getResultsCsv = (req: Request, res: Response) => {
  const scored = storage.getScored();
  const csv = stringify(scored, {
    header: true,
    columns: ["name", "role", "company", "industry", "location", "intent", "score", "reasoning"]
  });

  res.setHeader("Content-Disposition", "attachment; filename=lead_scores.csv");
  res.setHeader("Content-Type", "text/csv");
  res.send(csv);
};
