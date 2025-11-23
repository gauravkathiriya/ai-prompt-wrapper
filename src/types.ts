export type ProviderName = "openai" | "gemini";

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  role: MessageRole;
  content: string;
}

export interface AIClientConfig {
  provider: ProviderName;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ChatPromptInput {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResult {
  content: string;
  tokensUsed?: number;
  model?: string;
  finishReason?: string;
  provider?: string;
}

export interface SummarizeOptions {
  length?: "short" | "medium" | "long";
  language?: string;
  tone?: "neutral" | "formal" | "casual";
}

export interface SummarizeResult {
  summary: string;
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface FixGrammarOptions {
  keepTone?: boolean;
  language?: string;
}

export interface FixGrammarResult {
  corrected: string;
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface TranslateOptions {
  sourceLanguage?: string;
  preserveFormatting?: boolean;
}

export interface TranslateResult {
  translated: string;
  detectedSourceLanguage?: string;
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface AnswerQuestionOptions {
  maxLength?: number;
  temperature?: number;
}

export interface AnswerQuestionResult {
  answer: string;
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface RewriteOptions {
  tone?: "formal" | "casual" | "professional" | "friendly";
  preserveLength?: boolean;
}

export interface RewriteResult {
  rewritten: string;
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface SummarizeToBulletsOptions {
  maxBullets?: number;
  language?: string;
}

export interface SummarizeToBulletsResult {
  bullets: string[];
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface ExtractKeywordsOptions {
  maxKeywords?: number;
  minLength?: number;
}

export interface ExtractKeywordsResult {
  keywords: string[];
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface DetectLanguageResult {
  language: string;
  confidence: number;
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface ClassifySentimentResult {
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface CustomPromptOptions {
  temperature?: number;
  maxTokens?: number;
  variables?: Record<string, string>;
}

export interface CustomPromptResult {
  result: string;
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatStreamChunk {
  content: string;
  done: boolean;
}

export interface LLMProvider {
  chat(input: ChatPromptInput): Promise<ChatResult>;
  chatStream?(input: ChatPromptInput): AsyncIterable<ChatStreamChunk>;
}

export type RequestHook = (config: AIClientConfig, input: ChatPromptInput) => void;
export type ResponseHook = (result: ChatResult) => void;
export type ErrorHook = (error: Error) => void;

