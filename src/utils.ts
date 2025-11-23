import type { AIClientConfig, ProviderName } from "./types";

export function parseEnvConfig(): Partial<AIClientConfig> {
  const provider = (process.env.AI_PROVIDER || process.env.PROVIDER) as ProviderName | undefined;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  const model = process.env.AI_MODEL || process.env.MODEL;
  const temperature = process.env.AI_TEMPERATURE
    ? parseFloat(process.env.AI_TEMPERATURE)
    : undefined;
  const maxTokens = process.env.AI_MAX_TOKENS
    ? parseInt(process.env.AI_MAX_TOKENS, 10)
    : undefined;
  const timeout = process.env.AI_TIMEOUT
    ? parseInt(process.env.AI_TIMEOUT, 10)
    : undefined;
  const maxRetries = process.env.AI_MAX_RETRIES
    ? parseInt(process.env.AI_MAX_RETRIES, 10)
    : undefined;

  let apiKey: string | undefined;
  let resolvedProvider: ProviderName | undefined = provider;

  if (provider === "openai" && openaiKey) {
    apiKey = openaiKey;
  } else if (provider === "gemini" && geminiKey) {
    apiKey = geminiKey;
  } else if (!provider) {
    // Auto-detect based on available keys
    if (openaiKey) {
      resolvedProvider = "openai";
      apiKey = openaiKey;
    } else if (geminiKey) {
      resolvedProvider = "gemini";
      apiKey = geminiKey;
    }
  }

  return {
    provider: resolvedProvider,
    apiKey,
    model,
    temperature,
    maxTokens,
    timeout,
    maxRetries,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const statusCode = error.status || error.statusCode || error.response?.status;
  if (statusCode) {
    // Retry on 429 (rate limit) and 5xx (server errors)
    return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
  }
  
  // Retry on network errors
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
    return true;
  }
  
  return false;
}

