import { Request, Response } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { storage } from "../services/storage";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadMiddleware = upload.single("file");

export const uploadLeads = (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "CSV file required under form field 'file'." });
  const text = req.file.buffer.toString("utf8");
  let records;
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err) {
    return res.status(400).json({ error: "Failed to parse CSV: " + (err as Error).message });
  }

  // Normalize columns to expected
  const mapped = records.map((r: any) => ({
    name: r.name || r.Name || r.NAME || "",
    role: r.role || r.Role || "",
    company: r.company || r.Company || "",
    industry: r.industry || r.Industry || "",
    location: r.location || r.Location || "",
    linkedin_bio: r.linkedin_bio || r.linkedin || r["linkedin_bio"] || ""
  }));

  storage.addLeads(mapped);
  return res.status(201).json({ added: mapped.length });
};

export const getLeads = (req: Request, res: Response) => {
  return res.json(storage.getLeads());
};
