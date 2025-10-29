import express from "express";
import cors from "cors";

import offerRoutes from "./routes/offer";
import leadsRoutes from "./routes/leads";
import scoreRoutes from "./routes/score";
import resultsRoutes from "./routes/results";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/offer", offerRoutes);
app.use("/leads", leadsRoutes);
app.use("/score", scoreRoutes);
app.use("/results", resultsRoutes);

export default app;
