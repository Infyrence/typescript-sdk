import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  Model,
  ModelListResponse,
  HealthResponse,
  ProviderHealthResponse,
  InfyrenceClientOptions,
} from './types.js';
import { parseSSEStream } from './streaming.js';
import {
  createErrorFromResponse,
  InfyrenceError,
  AuthenticationError,
  ValidationError,
} from './errors.js';

const DEFAULT_BASE_URL = 'https://infyrence-api.infyrence.workers.dev';

export class Infyrence {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeout: number;

  readonly chat: {
    completions: {
      create: (params: ChatCompletionRequest) => Promise<ChatCompletionResponse>;
      createStream: (params: ChatCompletionRequest) => AsyncGenerator<ChatCompletionChunk, void, unknown>;
    };
  };

  readonly models: {
    list: () => Promise<Model[]>;
  };

  constructor(options: InfyrenceClientOptions) {
    if (!options.apiKey) {
      throw new AuthenticationError('API key is required');
    }

    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL?.replace(/\/+$/, '') ?? DEFAULT_BASE_URL;
    this.timeout = options.timeout ?? 60_000;

    this.chat = {
      completions: {
        create: this.createCompletion.bind(this),
        createStream: this.createCompletionStream.bind(this),
      },
    };

    this.models = {
      list: this.listModels.bind(this),
    };
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...extra,
    };
  }

  private async request<T>(
    path: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
    } = {}
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: options.headers ?? this.buildHeaders(),
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text().catch(() => null);
        }
        throw createErrorFromResponse(response, errorBody);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof InfyrenceError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new InfyrenceError(`Request timed out after ${this.timeout}ms`);
      }
      throw new InfyrenceError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async requestStream(
    path: string,
    body: unknown
  ): Promise<Response> {
    const url = `${this.baseURL}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text().catch(() => null);
        }
        throw createErrorFromResponse(response, errorBody);
      }

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof InfyrenceError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new InfyrenceError(`Request timed out after ${this.timeout}ms`);
      }
      throw new InfyrenceError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  private async createCompletion(
    params: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    if (params.stream) {
      throw new ValidationError(
        'Use chat.completions.createStream() for streaming. Or set stream: false.'
      );
    }

    return this.request<ChatCompletionResponse>('/v1/chat/completions', {
      method: 'POST',
      body: params,
    });
  }

  private async *createCompletionStream(
    params: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    const response = await this.requestStream('/v1/chat/completions', {
      ...params,
      stream: true,
    });

    yield* parseSSEStream(response);
  }

  private async listModels(): Promise<Model[]> {
    const response = await this.request<ModelListResponse>('/v1/models');
    return response.data;
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health', {
      headers: {},
    });
  }

  async providerHealth(): Promise<ProviderHealthResponse> {
    return this.request<ProviderHealthResponse>('/v1/health/providers', {
      headers: {},
    });
  }
}
