import OpenAI from "openai";
import { BaseProvider } from "./base";
import type { ChatPromptInput, ChatResult, ChatStreamChunk } from "../types";

export class OpenAIProvider extends BaseProvider {
  private client: OpenAI;

  constructor(apiKey: string, model: string = "gpt-4o-mini", baseUrl?: string) {
    super(apiKey, model, baseUrl);
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
    });
  }

  async chat(input: ChatPromptInput): Promise<ChatResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: input.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: input.temperature,
      max_tokens: input.maxTokens,
    });

    const choice = response.choices[0];
    if (!choice || !choice.message) {
      throw new Error("No response from OpenAI");
    }

    return {
      content: choice.message.content || "",
      tokensUsed: response.usage?.total_tokens,
      model: response.model,
      finishReason: choice.finish_reason || undefined,
    };
  }

  async *chatStream(input: ChatPromptInput): AsyncIterable<ChatStreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: input.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      yield {
        content: delta,
        done: chunk.choices[0]?.finish_reason !== null,
      };
    }
  }
}

