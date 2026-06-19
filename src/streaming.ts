import type { ChatCompletionChunk } from './types.js';
import { InfyrenceError } from './errors.js';

/** Parse one SSE `data:` payload. Returns a chunk, null to skip, or throws on an error event. */
function parsePayload(jsonStr: string): ChatCompletionChunk | null {
  let data: unknown;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return null; // malformed / keep-alive line
  }
  if (typeof data === 'object' && data !== null && 'error' in data) {
    const err = (data as { error?: { message?: string; type?: string; code?: string; request_id?: string } }).error;
    const error = new InfyrenceError(err?.message ?? 'Stream error');
    error.type = err?.type;
    error.code = err?.code;
    error.requestId = err?.request_id;
    throw error;
  }
  return data as ChatCompletionChunk;
}

export async function* parseSSEStream(
  response: Response
): AsyncGenerator<ChatCompletionChunk, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        const chunk = parsePayload(trimmed.slice(6));
        if (chunk) yield chunk;
      }
    }

    // Process any remaining buffered line.
    const tail = buffer.trim();
    if (tail !== '' && tail !== 'data: [DONE]' && tail.startsWith('data: ')) {
      const chunk = parsePayload(tail.slice(6));
      if (chunk) yield chunk;
    }
  } finally {
    reader.releaseLock();
  }
}
