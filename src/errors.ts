export class AIClientError extends Error {
  constructor(
    message: string,
    public readonly provider?: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "AIClientError";
    Object.setPrototypeOf(this, AIClientError.prototype);
  }
}

export class TimeoutError extends AIClientError {
  constructor(message: string = "Request timeout", provider?: string) {
    super(message, provider);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class RetryError extends AIClientError {
  constructor(
    message: string,
    public readonly retries: number,
    provider?: string,
    originalError?: Error
  ) {
    super(message, provider, undefined, originalError);
    this.name = "RetryError";
    Object.setPrototypeOf(this, RetryError.prototype);
  }
}

