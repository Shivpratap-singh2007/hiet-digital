// Supabase Edge Functions Shared AI Provider Abstraction
// Supports OpenAI and Google Gemini APIs with strict JSON output parsing
// Never exposes API keys to client; keys reside in Supabase Edge Secrets

export interface GenerateAiOptions {
  systemPrompt: string;
  userPrompt: string;
  schema?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}

export interface AiProviderConfig {
  provider: "openai" | "gemini";
  model: string;
  apiKey: string;
}

export function getAiConfig(): AiProviderConfig | null {
  const provider = (Deno.env.get("AI_PROVIDER") || "openai").toLowerCase();
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const geminiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") || Deno.env.get("GEMINI_API_KEY");

  if (provider === "gemini" && geminiKey) {
    return {
      provider: "gemini",
      model: Deno.env.get("AI_MODEL") || "gemini-1.5-flash",
      apiKey: geminiKey,
    };
  }

  if (openaiKey) {
    return {
      provider: "openai",
      model: Deno.env.get("AI_MODEL") || "gpt-4o-mini",
      apiKey: openaiKey,
    };
  }

  if (geminiKey) {
    return {
      provider: "gemini",
      model: Deno.env.get("AI_MODEL") || "gemini-1.5-flash",
      apiKey: geminiKey,
    };
  }

  return null;
}

export async function generateStructuredAiResponse<T>(
  options: GenerateAiOptions
): Promise<{ data: T | null; modelUsed: string; error?: string }> {
  const config = getAiConfig();
  if (!config) {
    return {
      data: null,
      modelUsed: "none",
      error: "AI provider credentials not configured in Supabase environment secrets.",
    };
  }

  const { systemPrompt, userPrompt, maxTokens = 800, temperature = 0.2 } = options;

  try {
    if (config.provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: `${systemPrompt}\n\nIMPORTANT: Respond with valid RFC8259 JSON only.` },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, modelUsed: config.model, error: `OpenAI error ${response.status}: ${errorText}` };
      }

      const json = await response.json();
      const rawContent = json?.choices?.[0]?.message?.content?.trim();
      if (!rawContent) {
        return { data: null, modelUsed: config.model, error: "Empty AI response" };
      }

      const parsed: T = JSON.parse(rawContent);
      return { data: parsed, modelUsed: config.model };
    }

    if (config.provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nIMPORTANT: Respond with strict valid JSON only, no markdown backticks.\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, modelUsed: config.model, error: `Gemini error ${response.status}: ${errorText}` };
      }

      const json = await response.json();
      const rawContent = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!rawContent) {
        return { data: null, modelUsed: config.model, error: "Empty AI response" };
      }

      // Strip potential markdown fence just in case
      const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
      const parsed: T = JSON.parse(cleaned);
      return { data: parsed, modelUsed: config.model };
    }

    return { data: null, modelUsed: config.model, error: "Unsupported provider" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { data: null, modelUsed: config.model, error: errorMsg };
  }
}
