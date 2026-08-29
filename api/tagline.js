export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { promptText } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = "gemini-3.5-flash";

  if (!geminiApiKey) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 1.0 }
      })
    }
  );

  res.status(geminiResponse.status);
  res.setHeader("Content-Type", "text/event-stream");

  const reader = geminiResponse.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(decoder.decode(value, { stream: true }));
  }
  res.end();
}