export class InfyrenceError extends Error {
  public readonly statusCode?: number;
  public readonly response?: Response;
  /** Gateway request id (X-Request-Id header / error body) — quote it for support. */
  public requestId?: string;
  /** Error `type` from the response envelope (e.g. "insufficient_credits"). */
  public type?: string;
  /** Error `code` from the response envelope, if present. */
  public code?: string;

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

/** Raised when the organization is out of credits (402). 1 credit = 1000 tokens. */
export class InsufficientCreditsError extends InfyrenceError {
  constructor(message = 'Insufficient credits (1 credit = 1000 tokens)', response?: Response) {
    super(message, 402, response);
    this.name = 'InsufficientCreditsError';
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

  let message = `Request failed with status ${status}`;
  let type: string | undefined;
  let code: string | undefined;
  let requestId: string | undefined;

  if (typeof body === 'object' && body !== null && 'error' in body) {
    const err = (body as { error?: { message?: string; type?: string; code?: string; request_id?: string } }).error;
    if (err) {
      if (err.message) message = err.message;
      type = err.type;
      code = err.code;
      requestId = err.request_id;
    }
  }
  // Header is the authoritative request id; fall back to the body's.
  requestId = response.headers?.get('x-request-id') ?? requestId;

  let error: InfyrenceError;
  switch (status) {
    case 400:
      error = new ValidationError(message, response);
      break;
    case 401:
      error = new AuthenticationError(message, response);
      break;
    case 402:
      error = new InsufficientCreditsError(message, response);
      break;
    case 404:
      error = new NotFoundError(message, response);
      break;
    case 429:
      error = new RateLimitError(message, response);
      break;
    default:
      error = status >= 500 ? new ServerError(message, status, response) : new InfyrenceError(message, status, response);
  }

  error.requestId = requestId;
  error.type = type;
  error.code = code;
  return error;
}
