export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  name?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string | string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  n?: number;
  seed?: number;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: Usage;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    delta: Partial<ChatMessage>;
    finish_reason: 'stop' | 'length' | 'tool_calls' | null;
  }[];
  usage?: Usage;
}

/** A model as returned by `GET /v1/models`. */
export interface Model {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  provider: string;
  capabilities: {
    chat: boolean;
    completions: boolean;
    embeddings: boolean;
  };
}

export interface ModelListResponse {
  object: 'list';
  data: Model[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

/** `GET /v1/health/providers` returns a map of provider name -> health. */
export type ProviderHealthResponse = Record<
  string,
  {
    healthy: boolean;
    lastChecked?: string;
    lastError?: string | null;
    consecutiveFailures?: number;
    totalRequests?: number;
    totalErrors?: number;
    avgLatencyMs?: number;
    recentErrors?: string[];
  }
>;

export interface InfyrenceClientOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

/** Billing is credit-based: 1 credit = 1000 tokens. */
export const TOKENS_PER_CREDIT = 1000;

/** Credits consumed for a token count (1 credit = 1000 tokens). */
export function creditsUsed(totalTokens: number): number {
  return totalTokens / TOKENS_PER_CREDIT;
}
