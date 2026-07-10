// Appwrite Function — deploy this separately in the Appwrite console
// (or via the Appwrite CLI). It keeps the Anthropic API key server-side.
//
// Required environment variable on this function (set in Appwrite console,
// not in the frontend's .env): ANTHROPIC_API_KEY
//
// Request body (JSON): { prompt: string, history: [{role, content}], room: string }
// Response body (JSON): { reply: string } on success, { error: string } on failure

export default async ({ req, res, log, error }) => {
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    error("ANTHROPIC_API_KEY is not set on this function.");
    return res.json({ error: "Server misconfiguration: missing API key." }, 500);
  }

  // Keep the last ~20 turns so the request stays within reasonable size.
  const trimmedHistory = history.slice(-20).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 8000),
  }));

  const systemPrompt = room
    ? `You are an engineering assistant embedded in the "${room}" room of a project workspace called DevRoom OS. Be concise and practical.`
    : "You are an engineering assistant embedded in a project workspace called DevRoom OS.";

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages:
          trimmedHistory.length > 0 ? trimmedHistory : [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      error(`Anthropic API error: ${anthropicRes.status} ${errText}`);
      return res.json({ error: `Anthropic API error (${anthropicRes.status})` }, 502);
    }

    const data = await anthropicRes.json();
    const reply = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return res.json({ reply: reply || "(empty response)" });
  } catch (err) {
    error(`Function error: ${err.message}`);
    return res.json({ error: "Failed to reach Anthropic API." }, 500);
  }
};
