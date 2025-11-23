import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIClient } from "../src/client";
import { AIClientError, TimeoutError, RetryError } from "../src/errors";

// Mock the providers
vi.mock("../src/providers/openai", () => {
  return {
    OpenAIProvider: vi.fn().mockImplementation(() => ({
      chat: vi.fn().mockResolvedValue({
        content: "Mocked response",
        tokensUsed: 100,
        model: "gpt-4o-mini",
      }),
      chatStream: vi.fn().mockImplementation(async function* () {
        yield { content: "Mocked ", done: false };
        yield { content: "stream", done: false };
        yield { content: " response", done: true };
      }),
    })),
  };
});

vi.mock("../src/providers/gemini", () => {
  return {
    GeminiProvider: vi.fn().mockImplementation(() => ({
      chat: vi.fn().mockResolvedValue({
        content: "Mocked Gemini response",
        tokensUsed: 150,
        model: "gemini-pro",
      }),
      chatStream: vi.fn().mockImplementation(async function* () {
        yield { content: "Gemini ", done: false };
        yield { content: "stream", done: true };
      }),
    })),
  };
});

describe("AIClient", () => {
  describe("Initialization", () => {
    it("should create client with OpenAI provider", () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });
      expect(client).toBeInstanceOf(AIClient);
    });

    it("should create client with Gemini provider", () => {
      const client = new AIClient({
        provider: "gemini",
        apiKey: "test-key",
      });
      expect(client).toBeInstanceOf(AIClient);
    });

    it("should throw error if API key is missing", () => {
      expect(() => {
        new AIClient({
          provider: "openai",
          apiKey: "",
        } as any);
      }).toThrow(AIClientError);
    });

    it("should use default model if not specified", () => {
      const openaiClient = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });
      expect(openaiClient).toBeInstanceOf(AIClient);

      const geminiClient = new AIClient({
        provider: "gemini",
        apiKey: "test-key",
      });
      expect(geminiClient).toBeInstanceOf(AIClient);
    });
  });

  describe("fromEnv", () => {
    beforeEach(() => {
      vi.resetModules();
      delete process.env.AI_PROVIDER;
      delete process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
    });

    it("should throw error if env vars are missing", () => {
      expect(() => {
        AIClient.fromEnv();
      }).toThrow(AIClientError);
    });
  });

  describe("summarize", () => {
    it("should summarize text", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.summarize("This is a long text that needs summarization.");
      expect(result).toHaveProperty("summary");
      expect(result.summary).toBe("Mocked response");
      expect(result.tokensUsed).toBe(100);
    });

    it("should summarize with options", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.summarize("Text", {
        length: "short",
        language: "en",
        tone: "formal",
      });
      expect(result).toHaveProperty("summary");
    });
  });

  describe("fixGrammar", () => {
    it("should fix grammar", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.fixGrammar("This is a text with erors.");
      expect(result).toHaveProperty("corrected");
      expect(result.corrected).toBe("Mocked response");
    });
  });

  describe("translate", () => {
    it("should translate text", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.translate("Hello", "hi");
      expect(result).toHaveProperty("translated");
      expect(result.translated).toBe("Mocked response");
    });
  });

  describe("answerQuestion", () => {
    it("should answer question based on context", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.answerQuestion("Context here", "What is this?");
      expect(result).toHaveProperty("answer");
      expect(result.answer).toBe("Mocked response");
    });
  });

  describe("rewrite", () => {
    it("should rewrite text", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.rewrite("Original text", "formal");
      expect(result).toHaveProperty("rewritten");
      expect(result.rewritten).toBe("Mocked response");
    });
  });

  describe("summarizeToBullets", () => {
    it("should summarize to bullet points", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.summarizeToBullets("Long text here");
      expect(result).toHaveProperty("bullets");
      expect(Array.isArray(result.bullets)).toBe(true);
    });
  });

  describe("extractKeywords", () => {
    it("should extract keywords", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.extractKeywords("Text with important keywords");
      expect(result).toHaveProperty("keywords");
      expect(Array.isArray(result.keywords)).toBe(true);
    });
  });

  describe("detectLanguage", () => {
    it("should detect language", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.detectLanguage("Bonjour le monde");
      expect(result).toHaveProperty("language");
      expect(result).toHaveProperty("confidence");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("classifySentiment", () => {
    it("should classify sentiment", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.classifySentiment("I love this product!");
      expect(result).toHaveProperty("sentiment");
      expect(result).toHaveProperty("score");
      expect(["positive", "neutral", "negative"]).toContain(result.sentiment);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  describe("customPrompt", () => {
    it("should handle custom prompt", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.customPrompt("Tell me about {{topic}}", {
        topic: "AI",
      });
      expect(result).toHaveProperty("result");
      expect(result.result).toBe("Mocked response");
    });

    it("should handle custom prompt without variables", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.customPrompt("Simple prompt");
      expect(result).toHaveProperty("result");
    });
  });

  describe("chat", () => {
    it("should handle chat messages", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const result = await client.chat([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ]);
      expect(result).toHaveProperty("content");
      expect(result.content).toBe("Mocked response");
    });
  });

  describe("chatStream", () => {
    it("should stream chat responses", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const chunks: string[] = [];
      for await (const chunk of client.chatStream([
        { role: "user", content: "Hello" },
      ])) {
        chunks.push(chunk.content);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join("")).toContain("Mocked");
    });
  });

  describe("hooks", () => {
    it("should call request hooks", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const requestHook = vi.fn();
      client.onRequest(requestHook);

      await client.summarize("Test");
      expect(requestHook).toHaveBeenCalled();
    });

    it("should call response hooks", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const responseHook = vi.fn();
      client.onResponse(responseHook);

      await client.summarize("Test");
      expect(responseHook).toHaveBeenCalled();
    });

    it("should call error hooks on error", async () => {
      const client = new AIClient({
        provider: "openai",
        apiKey: "test-key",
      });

      const errorHook = vi.fn();
      client.onError(errorHook);

      // Mock provider to throw error
      const { OpenAIProvider } = await import("../src/providers/openai");
      const mockProvider = new (OpenAIProvider as any)("key", "model");
      mockProvider.chat = vi.fn().mockRejectedValue(new Error("Test error"));
      (client as any).provider = mockProvider;

      try {
        await client.summarize("Test");
      } catch (error) {
        // Expected
      }

      expect(errorHook).toHaveBeenCalled();
    });
  });
});

