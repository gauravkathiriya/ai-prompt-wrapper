export const PROMPT_TEMPLATES = {
  summarize: (text: string, options?: { length?: string; language?: string; tone?: string }) => {
    const length = options?.length || "medium";
    const language = options?.language ? ` in ${options.language}` : "";
    const tone = options?.tone ? ` with a ${options.tone} tone` : "";
    
    return `Please summarize the following text${language}${tone}. Make it ${length} in length:\n\n${text}`;
  },

  fixGrammar: (text: string, options?: { keepTone?: boolean; language?: string }) => {
    const keepTone = options?.keepTone !== false;
    const language = options?.language ? ` (language: ${options.language})` : "";
    
    return `Please correct the grammar, spelling, and punctuation in the following text${language}. ${keepTone ? "Maintain the original tone and style." : ""}\n\n${text}`;
  },

  translate: (text: string, targetLang: string, options?: { sourceLanguage?: string; preserveFormatting?: boolean }) => {
    const source = options?.sourceLanguage ? ` from ${options.sourceLanguage}` : "";
    const preserve = options?.preserveFormatting ? " Preserve formatting, line breaks, and structure." : "";
    
    return `Translate the following text${source} to ${targetLang}.${preserve}\n\n${text}`;
  },

  answerQuestion: (context: string, question: string, options?: { maxLength?: number }) => {
    const maxLength = options?.maxLength ? ` (maximum ${options.maxLength} words)` : "";
    
    return `Based on the following context, answer the question${maxLength}:\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;
  },

  rewrite: (text: string, style: string, options?: { tone?: string; preserveLength?: boolean }) => {
    const tone = options?.tone ? ` with a ${options.tone} tone` : "";
    const preserve = options?.preserveLength ? " Maintain approximately the same length." : "";
    
    return `Rewrite the following text in a ${style} style${tone}.${preserve}\n\n${text}`;
  },

  summarizeToBullets: (text: string, options?: { maxBullets?: number; language?: string }) => {
    const maxBullets = options?.maxBullets ? ` (maximum ${options.maxBullets} bullets)` : "";
    const language = options?.language ? ` in ${options.language}` : "";
    
    return `Summarize the following text into bullet points${maxBullets}${language}:\n\n${text}`;
  },

  extractKeywords: (text: string, options?: { maxKeywords?: number; minLength?: number }) => {
    const maxKeywords = options?.maxKeywords ? ` (maximum ${options.maxKeywords} keywords)` : "";
    const minLength = options?.minLength ? ` (minimum ${options.minLength} characters per keyword)` : "";
    
    return `Extract the most important keywords or keyphrases from the following text${maxKeywords}${minLength}. Return only a comma-separated list of keywords:\n\n${text}`;
  },

  detectLanguage: (text: string) => {
    return `Detect the language of the following text and return only the ISO 639-1 language code (e.g., "en", "fr", "es"):\n\n${text}`;
  },

  classifySentiment: (text: string) => {
    return `Classify the sentiment of the following text as "positive", "neutral", or "negative". Return your response in the format: SENTIMENT|SCORE where SENTIMENT is one of the three options and SCORE is a number between 0 and 1:\n\n${text}`;
  },

  customPrompt: (prompt: string, variables?: Record<string, string>) => {
    let processedPrompt = prompt;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        processedPrompt = processedPrompt.replace(regex, value);
      }
    }
    return processedPrompt;
  },
};

