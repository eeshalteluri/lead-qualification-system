import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    PORT: z.number(),
    OPENAI_API_KEY: z.string(),
    DATABSE_URL: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);