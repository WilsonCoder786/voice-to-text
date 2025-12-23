import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import { z } from "zod";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 30
    })
);

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const bodySchema = z.object({
    urduText: z.string().min(5)
});

app.post("/api/translate", async (req, res) => {
    try {
        const { urduText } = bodySchema.parse(req.body);

        const response = await client.responses.create({
            model: "gpt-5",
            reasoning: { effort: "low" },
            instructions: `
You are a professional bilingual editor.

Task:
1. Translate Urdu to English (keep meaning exactly same).
2. Generate TWO outputs:
   - casual (simple, friendly)
   - professional (formal, grammatically perfect, email-ready)
3. Support long sentences.
4. No spelling or grammar mistakes.
5. Do NOT add extra meaning.

Return STRICT JSON:
{
  "casual": "...",
  "professional": "..."
}
      `,
            input: urduText
        });

        const output = response.output_text;
        const parsed = JSON.parse(output);

        res.json(parsed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Processing failed" });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Backend running on port ${process.env.PORT}`);
});
