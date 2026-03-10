import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: any, res: any) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const { messages, response_format } = req.body;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            temperature: 0,
            response_format,
        });
        res.status(200).json(completion);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
