export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { promptText } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-flash-latest";


  if (!geminiApiKey) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse`;
  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { temperature: 1.0 }
  });

  const maxAttempts = 2; // one initial try + one retry on overload
  let geminiResponse;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: requestBody
    });

    // 503 = model temporarily overloaded on Google's side, worth one retry.
    if (geminiResponse.status !== 503) break;

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

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
