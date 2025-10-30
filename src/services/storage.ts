import { Offer, LeadRaw, LeadScored } from "../models/type";

let currentOffer: Offer | null = null;
let leads: LeadRaw[] = [];
let scored: LeadScored[] = [];

export const storage = {
  setOffer(offer: Offer) {
    offer.created_at = new Date().toISOString();
    offer.id = "offer_" + Date.now();
    currentOffer = offer;
    return currentOffer;
  },
  getOffer() {
    return currentOffer;
  },
  addLeads(newLeads: LeadRaw[]) {
    leads = leads.concat(newLeads);
    return leads;
  },
  getLeads() {
    return leads;
  },
  setScored(results: LeadScored[]) {
    scored = results;
    return scored;
  },
  getScored() {
    return scored;
  },
  clearAll() {
    currentOffer = null;
    leads = [];
    scored = [];
  }
};
