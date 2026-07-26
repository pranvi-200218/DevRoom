// Appwrite Function — deploy this separately in the Appwrite console
// (or via the Appwrite CLI). It keeps the Groq API key server-side.
//
// Required environment variable on this function (set in Appwrite console,
// not in the frontend's .env): GROQ_API_KEY
// Get a free key at https://console.groq.com
//
// Request body (JSON): { prompt: string, history: [{role, content}], room: string }
// Response body (JSON): { reply: string } on success, { error: string } on failure

export default async({ req, res, log, error }) => {
    if (req.method !== "POST") {
        return res.json({ error: "Use POST." }, 405);
    }

    let body;
    try {
        body = JSON.parse(req.body || "{}");
    } catch {
        return res.json({ error: "Invalid JSON body." }, 400);
    }

    const { prompt, history = [], room = "" } = body;
    if (!prompt || typeof prompt !== "string") {
        return res.json({ error: "Missing 'prompt' string." }, 400);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        error("GROQ_API_KEY is not set on this function.");
        return res.json({ error: "Server misconfiguration: missing API key." }, 500);
    }

    // Keep the last ~20 turns so the request stays within reasonable size.
    const trimmedHistory = history.slice(-20).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 8000),
    }));

    const systemPrompt = room ?
        `You are an engineering assistant embedded in the "${room}" room of a project workspace called DevRoom OS. Be concise and practical.` :
        "You are an engineering assistant embedded in a project workspace called DevRoom OS.";

    const messages = [
        { role: "system", content: systemPrompt },
        ...(trimmedHistory.length > 0 ? trimmedHistory : [{ role: "user", content: prompt }]),
    ];

    try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                max_tokens: 1024,
                messages,
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            error(`Groq API error: ${groqRes.status} ${errText}`);
            return res.json({ error: `Groq API error (${groqRes.status})` }, 502);
        }

        const data = await groqRes.json();
        const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";

        return res.json({ reply: reply || "(empty response)" });
    } catch (err) {
        error(`Function error: ${err.message}`);
        return res.json({ error: "Failed to reach Groq API." }, 500);
    }
};