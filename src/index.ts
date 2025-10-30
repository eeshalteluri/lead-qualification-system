import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { postOffer, getOffer } from "./controllers/offerController";
import { uploadMiddleware, uploadLeads, getLeads } from "./controllers/leadsController";
import { runScoring, getResults, getResultsCsv } from "./controllers/scoreController";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/offer", postOffer);
app.get("/offer", getOffer);

app.post("/leads/upload", uploadMiddleware, uploadLeads);
app.get("/leads", getLeads);

app.post("/score", runScoring);
app.get("/results", getResults);
app.get("/results/csv", getResultsCsv);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Lead scoring API listening on port ${port}`);
});
