import OpenAI from "openai";

export default async function handler(req: any, res: any) {
    // Solo permitir POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "API Key no encontrada en el servidor. Asegúrate de configurar OPENAI_API_KEY en las variables de entorno de Vercel."
        });
    }

    try {
        const { messages, response_format } = req.body;

        // Inicializar cliente dentro del handler para mayor seguridad y robustez
        const openai = new OpenAI({
            apiKey: apiKey,
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            temperature: 0,
            response_format,
        });

        res.status(200).json(completion);
    } catch (error: any) {
        console.error("OpenAI API Route Error:", error);

        // Si OpenAI nos da un error de autenticación, lo devolvemos claro
        if (error.status === 401) {
            return res.status(401).json({
                error: "401: API Key incorrecta o expirada. Por favor, revisa que OPENAI_API_KEY en Vercel sea válida."
            });
        }

        res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
}
