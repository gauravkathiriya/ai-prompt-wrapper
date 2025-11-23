import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseProvider } from "./base";
import type { ChatPromptInput, ChatResult, ChatStreamChunk, Message } from "../types";

export class GeminiProvider extends BaseProvider {
  private client: GoogleGenerativeAI;
  private genModel: any;

  constructor(apiKey: string, model: string = "gemini-pro", baseUrl?: string) {
    super(apiKey, model, baseUrl);
    this.client = new GoogleGenerativeAI(this.apiKey);
    this.genModel = this.client.getGenerativeModel({ model: this.model });
  }


  async chat(input: ChatPromptInput): Promise<ChatResult> {
    const generationConfig: any = {};
    if (input.temperature !== undefined) {
      generationConfig.temperature = input.temperature;
    }
    if (input.maxTokens !== undefined) {
      generationConfig.maxOutputTokens = input.maxTokens;
    }

    // Convert messages to Gemini format
    const contents: any[] = [];
    let systemInstruction: string | undefined;

    for (const msg of input.messages) {
      if (msg.role === "system") {
        systemInstruction = (systemInstruction || "") + msg.content + "\n";
      } else {
        const role = msg.role === "assistant" ? "model" : "user";
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }

    const requestOptions: any = {
      contents,
      generationConfig,
    };

    if (systemInstruction) {
      requestOptions.systemInstruction = {
        parts: [{ text: systemInstruction.trim() }],
      };
    }

    const result = await this.genModel.generateContent(requestOptions);
    const response = result.response;
    const text = response.text();

    return {
      content: text,
      tokensUsed: response.usageMetadata?.totalTokenCount,
      model: this.model,
      finishReason: response.candidates?.[0]?.finishReason,
    };
  }

  async *chatStream(input: ChatPromptInput): AsyncIterable<ChatStreamChunk> {
    const generationConfig: any = {};
    if (input.temperature !== undefined) {
      generationConfig.temperature = input.temperature;
    }
    if (input.maxTokens !== undefined) {
      generationConfig.maxOutputTokens = input.maxTokens;
    }

    // Convert messages to Gemini format
    const contents: any[] = [];
    let systemInstruction: string | undefined;

    for (const msg of input.messages) {
      if (msg.role === "system") {
        systemInstruction = (systemInstruction || "") + msg.content + "\n";
      } else {
        const role = msg.role === "assistant" ? "model" : "user";
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }

    const requestOptions: any = {
      contents,
      generationConfig,
    };

    if (systemInstruction) {
      requestOptions.systemInstruction = {
        parts: [{ text: systemInstruction.trim() }],
      };
    }

    const result = await this.genModel.generateContentStream(requestOptions);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      yield {
        content: text,
        done: chunk.candidates?.[0]?.finishReason !== null,
      };
    }
  }
}

