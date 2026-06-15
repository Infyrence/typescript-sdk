export class InfyrenceError extends Error {
  public readonly statusCode?: number;
  public readonly response?: Response;

  constructor(message: string, statusCode?: number, response?: Response) {
    super(message);
    this.name = 'InfyrenceError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

export class AuthenticationError extends InfyrenceError {
  constructor(message = 'Invalid or missing API key', response?: Response) {
    super(message, 401, response);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends InfyrenceError {
  constructor(message = 'Rate limit exceeded', response?: Response) {
    super(message, 429, response);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends InfyrenceError {
  constructor(message: string, response?: Response) {
    super(message, 400, response);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends InfyrenceError {
  constructor(message = 'Resource not found', response?: Response) {
    super(message, 404, response);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends InfyrenceError {
  constructor(message = 'Internal server error', statusCode = 500, response?: Response) {
    super(message, statusCode, response);
    this.name = 'ServerError';
  }
}

export function createErrorFromResponse(response: Response, body?: unknown): InfyrenceError {
  const status = response.status;
  const message =
    typeof body === 'object' && body !== null && 'error' in body
      ? String((body as { error: { message?: string } }).error?.message ?? 'Unknown error')
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
