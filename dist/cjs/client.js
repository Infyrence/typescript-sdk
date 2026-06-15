"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Infyrence = void 0;
const streaming_js_1 = require("./streaming.js");
const errors_js_1 = require("./errors.js");
const DEFAULT_BASE_URL = 'https://infyrence-api.infyrence.workers.dev';
class Infyrence {
    apiKey;
    baseURL;
    timeout;
    chat;
    models;
    constructor(options) {
        if (!options.apiKey) {
            throw new errors_js_1.AuthenticationError('API key is required');
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
    buildHeaders(extra) {
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            ...extra,
        };
    }
    async request(path, options = {}) {
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
                let errorBody;
                try {
                    errorBody = await response.json();
                }
                catch {
                    errorBody = await response.text().catch(() => null);
                }
                throw (0, errors_js_1.createErrorFromResponse)(response, errorBody);
            }
            return (await response.json());
        }
        catch (error) {
            if (error instanceof errors_js_1.InfyrenceError)
                throw error;
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new errors_js_1.InfyrenceError(`Request timed out after ${this.timeout}ms`);
            }
            throw new errors_js_1.InfyrenceError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    async requestStream(path, body) {
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
                let errorBody;
                try {
                    errorBody = await response.json();
                }
                catch {
                    errorBody = await response.text().catch(() => null);
                }
                throw (0, errors_js_1.createErrorFromResponse)(response, errorBody);
            }
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof errors_js_1.InfyrenceError)
                throw error;
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new errors_js_1.InfyrenceError(`Request timed out after ${this.timeout}ms`);
            }
            throw new errors_js_1.InfyrenceError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
    async createCompletion(params) {
        if (params.stream) {
            throw new errors_js_1.ValidationError('Use chat.completions.createStream() for streaming. Or set stream: false.');
        }
        return this.request('/v1/chat/completions', {
            method: 'POST',
            body: params,
        });
    }
    async *createCompletionStream(params) {
        const response = await this.requestStream('/v1/chat/completions', {
            ...params,
            stream: true,
        });
        yield* (0, streaming_js_1.parseSSEStream)(response);
    }
    async listModels() {
        const response = await this.request('/v1/models');
        return response.data;
    }
    async health() {
        return this.request('/health', {
            headers: {},
        });
    }
    async providerHealth() {
        return this.request('/v1/health/providers', {
            headers: {},
        });
    }
}
exports.Infyrence = Infyrence;
//# sourceMappingURL=client.js.map