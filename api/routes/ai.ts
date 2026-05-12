import { Router } from "express";
import OpenAI from "openai";

export const aiRouter = Router();

// Ensure the API key is picked up from environment
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": "https://pottapk.win", // OpenRouter requires referer
    "X-Title": "Ledgerly Budget Tracker", // OpenRouter requires title
  }
});

aiRouter.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const completion = await openai.chat.completions.create({
      model: "google/gemma-7b-it:free", // using an open source free model as requested
      messages: [
        {
          role: "system",
          content: "You are a helpful AI financial assistant for 'Ledgerly', a budget tracker application. Be concise, friendly, and practical with financial advice."
        },
        ...messages
      ],
    });

    res.json({
      reply: completion.choices[0]?.message?.content || "No response generated."
    });
  } catch (error: any) {
    console.error("OpenRouter API error:", error);
    res.status(500).json({ error: "Failed to communicate with AI.", details: error.message });
  }
});
