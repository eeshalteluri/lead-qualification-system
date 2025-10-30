import { Request, Response } from "express";
import { storage } from "../services/storage";

export const postOffer = (req: Request, res: Response) => {
  const offer = req.body;
  if (!offer || !offer.name) {
    return res.status(400).json({ error: "Offer must include at least a 'name' field." });
  }
  const saved = storage.setOffer(offer);
  res.status(201).json(saved);
};

export const getOffer = (req: Request, res: Response) => {
  const offer = storage.getOffer();
  if (!offer) return res.status(404).json({ error: "No offer stored" });
  return res.json(offer);
};
