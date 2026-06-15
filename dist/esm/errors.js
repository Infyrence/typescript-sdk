export class InfyrenceError extends Error {
    statusCode;
    response;
    constructor(message, statusCode, response) {
        super(message);
        this.name = 'InfyrenceError';
        this.statusCode = statusCode;
        this.response = response;
    }
}
export class AuthenticationError extends InfyrenceError {
    constructor(message = 'Invalid or missing API key', response) {
        super(message, 401, response);
        this.name = 'AuthenticationError';
    }
}
export class RateLimitError extends InfyrenceError {
    constructor(message = 'Rate limit exceeded', response) {
        super(message, 429, response);
        this.name = 'RateLimitError';
    }
}
export class ValidationError extends InfyrenceError {
    constructor(message, response) {
        super(message, 400, response);
        this.name = 'ValidationError';
    }
}
export class NotFoundError extends InfyrenceError {
    constructor(message = 'Resource not found', response) {
        super(message, 404, response);
        this.name = 'NotFoundError';
    }
}
export class ServerError extends InfyrenceError {
    constructor(message = 'Internal server error', statusCode = 500, response) {
        super(message, statusCode, response);
        this.name = 'ServerError';
    }
}
export function createErrorFromResponse(response, body) {
    const status = response.status;
    const message = typeof body === 'object' && body !== null && 'error' in body
        ? String(body.error?.message ?? 'Unknown error')
        : `Request failed with status ${status}`;
    switch (status) {
        case 401:
            return new AuthenticationError(message, response);
        case 400:
            return new ValidationError(message, response);
        case 404:
            return new NotFoundError(message, response);
        case 429:
            return new RateLimitError(message, response);
        default:
            if (status >= 500) {
                return new ServerError(message, status, response);
            }
            return new InfyrenceError(message, status, response);
    }
}
//# sourceMappingURL=errors.js.map