export declare class InfyrenceError extends Error {
    readonly statusCode?: number;
    readonly response?: Response;
    constructor(message: string, statusCode?: number, response?: Response);
}
export declare class AuthenticationError extends InfyrenceError {
    constructor(message?: string, response?: Response);
}
export declare class RateLimitError extends InfyrenceError {
    constructor(message?: string, response?: Response);
}
export declare class ValidationError extends InfyrenceError {
    constructor(message: string, response?: Response);
}
export declare class NotFoundError extends InfyrenceError {
    constructor(message?: string, response?: Response);
}
export declare class ServerError extends InfyrenceError {
    constructor(message?: string, statusCode?: number, response?: Response);
}
export declare function createErrorFromResponse(response: Response, body?: unknown): InfyrenceError;
//# sourceMappingURL=errors.d.ts.map