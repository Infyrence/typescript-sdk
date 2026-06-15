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

export interface Model {
  id: string;
  name: string;
  provider: string;
  context: string;
  input_price: string;
  output_price: string;
  tags: string[];
}

export interface ModelListResponse {
  object: 'list';
  data: Model[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface ProviderHealthResponse {
  status: string;
  providers: Record<string, { status: string; latency?: number }>;
}

export interface InfyrenceClientOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}
