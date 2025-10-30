import axios from "axios";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  // Not fatal here — scoring function will throw if AI not configured.
}

export async function askIntentClassification(prompt: string, maxTokens = 200): Promise<string> {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not provided in env");

  const resp = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini", // replace if not available. gpt-4 or gpt-4o also fine.
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0,
      max_tokens: maxTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const text = resp.data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("AI provider returned no content");
  return text.trim();
}
