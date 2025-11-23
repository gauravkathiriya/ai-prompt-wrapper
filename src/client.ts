import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { AIClientError, TimeoutError, RetryError } from "./errors";
import { PROMPT_TEMPLATES } from "./prompts/presets";
import { parseEnvConfig, sleep, isRetryableError } from "./utils";
import type {
  AIClientConfig,
  LLMProvider,
  ChatPromptInput,
  ChatResult,
  ChatStreamChunk,
  Message,
  SummarizeOptions,
  SummarizeResult,
  FixGrammarOptions,
  FixGrammarResult,
  TranslateOptions,
  TranslateResult,
  AnswerQuestionOptions,
  AnswerQuestionResult,
  RewriteOptions,
  RewriteResult,
  SummarizeToBulletsOptions,
  SummarizeToBulletsResult,
  ExtractKeywordsOptions,
  ExtractKeywordsResult,
  DetectLanguageResult,
  ClassifySentimentResult,
  CustomPromptOptions,
  CustomPromptResult,
  ChatOptions,
  RequestHook,
  ResponseHook,
  ErrorHook,
} from "./types";

export class AIClient {
  private provider: LLMProvider;
  private config: AIClientConfig;
  private requestHooks: RequestHook[] = [];
  private responseHooks: ResponseHook[] = [];
  private errorHooks: ErrorHook[] = [];

  constructor(config: AIClientConfig) {
    if (!config.apiKey) {
      throw new AIClientError("API key is required");
    }

    this.config = {
      temperature: 0.7,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      ...config,
    };

    // Set default model based on provider if not specified
    if (!this.config.model) {
      if (this.config.provider === "openai") {
        this.config.model = "gpt-4o-mini";
      } else if (this.config.provider === "gemini") {
        this.config.model = "gemini-pro";
      }
    }

    // Initialize provider
    if (this.config.provider === "openai") {
      this.provider = new OpenAIProvider(
        this.config.apiKey,
        this.config.model!,
        this.config.baseUrl
      );
    } else if (this.config.provider === "gemini") {
      this.provider = new GeminiProvider(
        this.config.apiKey,
        this.config.model!,
        this.config.baseUrl
      );
    } else {
      throw new AIClientError(`Unsupported provider: ${this.config.provider}`);
    }
  }

  static fromEnv(): AIClient {
    const envConfig = parseEnvConfig();
    if (!envConfig.provider || !envConfig.apiKey) {
      throw new AIClientError(
        "Missing required environment variables. Set AI_PROVIDER (or PROVIDER) and corresponding API key (OPENAI_API_KEY or GEMINI_API_KEY)"
      );
    }
    return new AIClient(envConfig as AIClientConfig);
  }

  onRequest(hook: RequestHook): void {
    this.requestHooks.push(hook);
  }

  onResponse(hook: ResponseHook): void {
    this.responseHooks.push(hook);
  }

  onError(hook: ErrorHook): void {
    this.errorHooks.push(hook);
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    operation: string
  ): Promise<T> {
    const maxRetries = this.config.maxRetries || 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeWithTimeout(fn);
      } catch (error: any) {
        lastError = error;

        // Call error hooks
        for (const hook of this.errorHooks) {
          try {
            hook(error);
          } catch (hookError) {
            // Ignore hook errors
          }
        }

        // Check if we should retry
        if (attempt < maxRetries && isRetryableError(error)) {
          const delay = (this.config.retryDelay || 1000) * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }

        // If not retryable or out of retries, throw
        if (attempt === maxRetries) {
          throw new RetryError(
            `Failed after ${maxRetries} retries: ${error.message}`,
            maxRetries,
            this.config.provider,
            error
          );
        }

        throw error;
      }
    }

    throw lastError || new AIClientError(`Failed to execute ${operation}`);
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    const timeout = this.config.timeout || 30000;

    return new Promise<T>(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new TimeoutError(`Request timed out after ${timeout}ms`, this.config.provider));
      }, timeout);

      try {
        const result = await fn();
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  private async callProvider(input: ChatPromptInput): Promise<ChatResult> {
    // Call request hooks
    for (const hook of this.requestHooks) {
      try {
        hook(this.config, input);
      } catch (error) {
        // Ignore hook errors
      }
    }

    const result = await this.executeWithRetry(
      () => this.provider.chat(input),
      "chat"
    );

    // Call response hooks
    for (const hook of this.responseHooks) {
      try {
        hook(result);
      } catch (error) {
        // Ignore hook errors
      }
    }

    return {
      ...result,
      provider: this.config.provider,
      model: result.model || this.config.model,
    };
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<SummarizeResult> {
    const prompt = PROMPT_TEMPLATES.summarize(text, options);
    const result = await this.callProvider({
      messages: [{ role: "user", content: prompt }],
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    return {
      summary: result.content,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async fixGrammar(text: string, options?: FixGrammarOptions): Promise<FixGrammarResult> {
    const prompt = PROMPT_TEMPLATES.fixGrammar(text, options);
    const result = await this.callProvider({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Lower temperature for grammar correction
      maxTokens: this.config.maxTokens,
    });

    return {
      corrected: result.content,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async translate(
    text: string,
    targetLang: string,
    options?: TranslateOptions
  ): Promise<TranslateResult> {
    const prompt = PROMPT_TEMPLATES.translate(text, targetLang, options);
    const result = await this.callProvider({
      messages: [{ role: "user", content: prompt }],
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    return {
      translated: result.content,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async answerQuestion(
    context: string,
    question: string,
    options?: AnswerQuestionOptions
  ): Promise<AnswerQuestionResult> {
    const prompt = PROMPT_TEMPLATES.answerQuestion(context, question, options);
    const result = await this.callProvider({
      messages: [{ role: "user", content: prompt }],
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    return {
      answer: result.content,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async rewrite(
    text: string,
    style: "formal" | "casual" | "short" | "detailed",
    options?: RewriteOptions
  ): Promise<RewriteResult> {
    const prompt = PROMPT_TEMPLATES.rewrite(text, style, options);
    const result = await this.callProvider({
      messages: [{ role: "user", content: prompt }],
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    return {
      rewritten: result.content,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async summarizeToBullets(
    text: string,
    options?: SummarizeToBulletsOptions
  ): Promise<SummarizeToBulletsResult> {
    const prompt = PROMPT_TEMPLATES.summarizeToBullets(text, options);
    const result = await this.callProvider({
      messages: [{ role: "user", content: prompt }],
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    // Parse bullet points from response
    const bullets = result.content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[-*•]\s*/, ""))
      .filter((line) => line.length > 0);

    return {
      bullets,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async extractKeywords(
    text: string,
    options?: ExtractKeywordsOptions
  ): Promise<ExtractKeywordsResult> {
    const prompt = PROMPT_TEMPLATES.extractKeywords(text, options);
    const result = await this.callProvider({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Lower temperature for extraction
      maxTokens: this.config.maxTokens,
    });

    // Parse keywords from comma-separated list
    const keywords = result.content
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    return {
      keywords,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async detectLanguage(text: string): Promise<DetectLanguageResult> {
    const prompt = PROMPT_TEMPLATES.detectLanguage(text);
    const result = await this.callProvider({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Very low temperature for detection
      maxTokens: 10,
    });

    const language = result.content.trim().toLowerCase();
    // Simple confidence calculation (could be improved)
    const confidence = language.length === 2 ? 0.9 : 0.7;

    return {
      language,
      confidence,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async classifySentiment(text: string): Promise<ClassifySentimentResult> {
    const prompt = PROMPT_TEMPLATES.classifySentiment(text);
    const result = await this.callProvider({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      maxTokens: 20,
    });

    // Parse sentiment and score
    const parts = result.content.split("|");
    let sentiment: "positive" | "neutral" | "negative" = "neutral";
    let score = 0.5;

    if (parts.length >= 2) {
      const sent = parts[0].trim().toLowerCase();
      if (sent === "positive" || sent === "neutral" || sent === "negative") {
        sentiment = sent;
      }
      const parsedScore = parseFloat(parts[1].trim());
      if (!isNaN(parsedScore)) {
        score = Math.max(0, Math.min(1, parsedScore));
      }
    }

    return {
      sentiment,
      score,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async customPrompt(
    prompt: string,
    variables?: Record<string, string>,
    options?: CustomPromptOptions
  ): Promise<CustomPromptResult> {
    const processedPrompt = PROMPT_TEMPLATES.customPrompt(prompt, variables);
    const result = await this.callProvider({
      messages: [{ role: "user", content: processedPrompt }],
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
    });

    return {
      result: result.content,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResult> {
    const result = await this.callProvider({
      messages,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      stream: options?.stream,
    });

    return result;
  }

  async *chatStream(
    messages: Message[],
    options?: ChatOptions
  ): AsyncIterable<ChatStreamChunk> {
    if (!this.provider.chatStream) {
      throw new AIClientError(
        "Streaming not supported by this provider",
        this.config.provider
      );
    }

    const input: ChatPromptInput = {
      messages,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      stream: true,
    };

    // Call request hooks
    for (const hook of this.requestHooks) {
      try {
        hook(this.config, input);
      } catch (error) {
        // Ignore hook errors
      }
    }

    try {
      const stream = this.provider.chatStream(input);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error: any) {
      // Call error hooks
      for (const hook of this.errorHooks) {
        try {
          hook(error);
        } catch (hookError) {
          // Ignore hook errors
        }
      }
      throw new AIClientError(
        `Streaming error: ${error.message}`,
        this.config.provider,
        undefined,
        error
      );
    }
  }
}

