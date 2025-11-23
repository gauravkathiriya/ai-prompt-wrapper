import type { LLMProvider, ChatPromptInput, ChatResult, ChatStreamChunk } from "../types";

export abstract class BaseProvider implements LLMProvider {
  protected apiKey: string;
  protected model: string;
  protected baseUrl?: string;

  constructor(apiKey: string, model: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  abstract chat(input: ChatPromptInput): Promise<ChatResult>;
  
  async chatStream?(input: ChatPromptInput): AsyncIterable<ChatStreamChunk> {
    throw new Error("Streaming not implemented for this provider");
  }
}

