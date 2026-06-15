import type { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, Model, HealthResponse, ProviderHealthResponse, InfyrenceClientOptions } from './types.js';
export declare class Infyrence {
    private readonly apiKey;
    private readonly baseURL;
    private readonly timeout;
    readonly chat: {
        completions: {
            create: (params: ChatCompletionRequest) => Promise<ChatCompletionResponse>;
            createStream: (params: ChatCompletionRequest) => AsyncGenerator<ChatCompletionChunk, void, unknown>;
        };
    };
    readonly models: {
        list: () => Promise<Model[]>;
    };
    constructor(options: InfyrenceClientOptions);
    private buildHeaders;
    private request;
    private requestStream;
    private createCompletion;
    private createCompletionStream;
    private listModels;
    health(): Promise<HealthResponse>;
    providerHealth(): Promise<ProviderHealthResponse>;
}
//# sourceMappingURL=client.d.ts.map