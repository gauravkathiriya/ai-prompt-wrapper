# ai-prompt-wrapper

A simple TypeScript wrapper around AI APIs (OpenAI and Gemini) that provides convenient methods for common AI tasks like summarization, translation, grammar correction, and more.

## Features

- 🚀 **Simple API**: High-level methods for common AI tasks
- 🔄 **Multi-Provider**: Support for OpenAI and Google Gemini
- 🛡️ **Type-Safe**: Full TypeScript support with comprehensive types
- 🔁 **Retry Logic**: Automatic retry on transient errors
- ⏱️ **Timeout Support**: Configurable request timeouts
- 📊 **Hooks/Middleware**: Request/response/error hooks for logging and metrics
- 🌊 **Streaming**: Optional streaming support for chat responses
- 🎯 **Prompt Templating**: Custom prompts with variable substitution

## Installation

```bash
npm install ai-prompt-wrapper
```

or

```bash
yarn add ai-prompt-wrapper
```

or

```bash
pnpm add ai-prompt-wrapper
```

## Quick Start

### Basic Usage

```typescript
import { AIClient } from "ai-prompt-wrapper";

const ai = new AIClient({
  provider: "openai", // or "gemini"
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini", // optional, defaults provided
});

// Summarize text
const summary = await ai.summarize("Long article text here...");
console.log(summary.summary);

// Fix grammar
const corrected = await ai.fixGrammar("This is a text with erors.");
console.log(corrected.corrected);

// Translate
const translated = await ai.translate("Hello, world!", "hi");
console.log(translated.translated);
```

### Using Environment Variables

```typescript
import { AIClient } from "ai-prompt-wrapper";

// Reads from environment variables
const ai = AIClient.fromEnv();
```

Set these environment variables:
- `AI_PROVIDER` or `PROVIDER`: `"openai"` or `"gemini"`
- `OPENAI_API_KEY`: Your OpenAI API key (if using OpenAI)
- `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY`: Your Gemini API key (if using Gemini)
- `AI_MODEL` or `MODEL`: Optional model name
- `AI_TEMPERATURE`: Optional temperature (0-1)
- `AI_MAX_TOKENS`: Optional max tokens
- `AI_TIMEOUT`: Optional timeout in milliseconds
- `AI_MAX_RETRIES`: Optional max retry attempts

## API Reference

### Core Methods

#### `summarize(text: string, options?: SummarizeOptions): Promise<SummarizeResult>`

Summarizes the given text.

```typescript
const result = await ai.summarize("Long article text...", {
  length: "short", // "short" | "medium" | "long"
  language: "en",
  tone: "formal", // "neutral" | "formal" | "casual"
});

console.log(result.summary);
console.log(result.tokensUsed);
```

#### `fixGrammar(text: string, options?: FixGrammarOptions): Promise<FixGrammarResult>`

Corrects grammar, spelling, and punctuation.

```typescript
const result = await ai.fixGrammar("This is a text with erors.", {
  keepTone: true,
  language: "en",
});

console.log(result.corrected);
```

#### `translate(text: string, targetLang: string, options?: TranslateOptions): Promise<TranslateResult>`

Translates text to the target language.

```typescript
const result = await ai.translate("Hello, world!", "hi", {
  sourceLanguage: "en",
  preserveFormatting: true,
});

console.log(result.translated);
console.log(result.detectedSourceLanguage);
```

#### `answerQuestion(context: string, question: string, options?: AnswerQuestionOptions): Promise<AnswerQuestionResult>`

Answers a question based on provided context.

```typescript
const result = await ai.answerQuestion(
  "The capital of France is Paris.",
  "What is the capital of France?",
  {
    maxLength: 50,
  }
);

console.log(result.answer);
```

#### `rewrite(text: string, style: "formal" | "casual" | "short" | "detailed", options?: RewriteOptions): Promise<RewriteResult>`

Rewrites text in the specified style.

```typescript
const result = await ai.rewrite("Hey there!", "formal", {
  tone: "professional",
  preserveLength: false,
});

console.log(result.rewritten);
```

#### `summarizeToBullets(text: string, options?: SummarizeToBulletsOptions): Promise<SummarizeToBulletsResult>`

Summarizes text into bullet points.

```typescript
const result = await ai.summarizeToBullets("Long article...", {
  maxBullets: 5,
  language: "en",
});

console.log(result.bullets); // Array of bullet point strings
```

#### `extractKeywords(text: string, options?: ExtractKeywordsOptions): Promise<ExtractKeywordsResult>`

Extracts important keywords from text.

```typescript
const result = await ai.extractKeywords("Article about AI and machine learning...", {
  maxKeywords: 10,
  minLength: 3,
});

console.log(result.keywords); // Array of keyword strings
```

#### `detectLanguage(text: string): Promise<DetectLanguageResult>`

Detects the language of the text.

```typescript
const result = await ai.detectLanguage("Bonjour le monde");
console.log(result.language); // "fr"
console.log(result.confidence); // 0.9
```

#### `classifySentiment(text: string): Promise<ClassifySentimentResult>`

Classifies the sentiment of the text.

```typescript
const result = await ai.classifySentiment("I love this product!");
console.log(result.sentiment); // "positive" | "neutral" | "negative"
console.log(result.score); // 0.95
```

#### `customPrompt(prompt: string, variables?: Record<string, string>, options?: CustomPromptOptions): Promise<CustomPromptResult>`

Executes a custom prompt with variable substitution.

```typescript
const result = await ai.customPrompt(
  "Summarize this in 3 bullets: {{text}}",
  { text: "Long article content here..." },
  {
    temperature: 0.7,
    maxTokens: 500,
  }
);

console.log(result.result);
```

#### `chat(messages: Message[], options?: ChatOptions): Promise<ChatResult>`

Low-level chat interface for full flexibility.

```typescript
const result = await ai.chat(
  [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is AI?" },
  ],
  {
    temperature: 0.7,
    maxTokens: 1000,
  }
);

console.log(result.content);
```

#### `chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<ChatStreamChunk>`

Streaming chat interface.

```typescript
for await (const chunk of ai.chatStream([
  { role: "user", content: "Tell me a story" },
])) {
  process.stdout.write(chunk.content);
  if (chunk.done) break;
}
```

## Advanced Usage

### Provider Switching

You can easily switch between providers:

```typescript
// OpenAI
const openaiClient = new AIClient({
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini",
});

// Gemini
const geminiClient = new AIClient({
  provider: "gemini",
  apiKey: process.env.GEMINI_API_KEY!,
  model: "gemini-pro",
});
```

### Setting Default Options

```typescript
const ai = new AIClient({
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY!,
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
});
```

### Using Hooks/Middleware

Register hooks for logging, metrics, or debugging:

```typescript
// Request hook
ai.onRequest((config, input) => {
  console.log("Request:", {
    provider: config.provider,
    model: config.model,
    messageCount: input.messages.length,
  });
});

// Response hook
ai.onResponse((result) => {
  console.log("Response:", {
    tokensUsed: result.tokensUsed,
    model: result.model,
  });
});

// Error hook
ai.onError((error) => {
  console.error("Error:", error.message);
});
```

### Error Handling

The library provides custom error classes:

```typescript
import { AIClientError, TimeoutError, RetryError } from "ai-prompt-wrapper";

try {
  const result = await ai.summarize("Text");
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error("Request timed out");
  } else if (error instanceof RetryError) {
    console.error(`Failed after ${error.retries} retries`);
  } else if (error instanceof AIClientError) {
    console.error(`AI Client Error: ${error.message}`);
    console.error(`Provider: ${error.provider}`);
    console.error(`Status Code: ${error.statusCode}`);
  }
}
```

## TypeScript Usage

The library is fully typed. All methods, options, and results have TypeScript interfaces:

```typescript
import type {
  AIClientConfig,
  SummarizeOptions,
  SummarizeResult,
  Message,
  ChatResult,
} from "ai-prompt-wrapper";

const config: AIClientConfig = {
  provider: "openai",
  apiKey: "key",
  model: "gpt-4o-mini",
};

const options: SummarizeOptions = {
  length: "short",
  tone: "formal",
};

const result: SummarizeResult = await ai.summarize("Text", options);
```

## Configuration Options

### `AIClientConfig`

```typescript
interface AIClientConfig {
  provider: "openai" | "gemini";
  apiKey: string;
  model?: string; // Defaults: "gpt-4o-mini" (OpenAI), "gemini-pro" (Gemini)
  temperature?: number; // Default: 0.7
  maxTokens?: number;
  baseUrl?: string; // Optional override for API base URL
  timeout?: number; // Default: 30000ms
  maxRetries?: number; // Default: 3
  retryDelay?: number; // Default: 1000ms
}
```

## Limitations & Best Practices

### Limitations

1. **Rate Limits**: The library handles retries for rate limits (429), but you should still be mindful of your provider's rate limits.
2. **Token Limits**: Be aware of model token limits. The library doesn't automatically truncate input.
3. **Cost**: Each API call incurs costs. Monitor your usage.
4. **Streaming**: Streaming support depends on the provider implementation.

### Best Practices

1. **Environment Variables**: Use environment variables for API keys. Never commit them to version control.
2. **Error Handling**: Always wrap API calls in try-catch blocks.
3. **Timeouts**: Set appropriate timeouts based on your use case.
4. **Retries**: The default retry logic handles transient errors, but you may want to adjust `maxRetries` based on your needs.
5. **Type Safety**: Leverage TypeScript types for better IDE support and error catching.
6. **Hooks**: Use hooks for logging and monitoring in production.

## Examples

### Example: Batch Processing

```typescript
const texts = ["Text 1", "Text 2", "Text 3"];

const summaries = await Promise.all(
  texts.map((text) => ai.summarize(text, { length: "short" }))
);

summaries.forEach((summary, index) => {
  console.log(`Summary ${index + 1}:`, summary.summary);
});
```

### Example: Language Detection and Translation

```typescript
const text = "Bonjour le monde";

// Detect language
const detection = await ai.detectLanguage(text);
console.log(`Detected: ${detection.language}`);

// Translate to English
if (detection.language !== "en") {
  const translation = await ai.translate(text, "en");
  console.log(`Translation: ${translation.translated}`);
}
```

### Example: Content Analysis Pipeline

```typescript
const article = "Long article text...";

// Analyze article
const [summary, keywords, sentiment] = await Promise.all([
  ai.summarize(article, { length: "medium" }),
  ai.extractKeywords(article, { maxKeywords: 10 }),
  ai.classifySentiment(article),
]);

console.log("Summary:", summary.summary);
console.log("Keywords:", keywords.keywords);
console.log("Sentiment:", sentiment.sentiment, sentiment.score);
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
