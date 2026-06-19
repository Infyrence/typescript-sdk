# infyrence

TypeScript SDK for the [Infyrence](https://infyrence.com) AI inference API.

One API key, many models — Gemini, Llama, Qwen, GPT-OSS, DeepSeek and more, through a single OpenAI-compatible endpoint (`https://api.infyrence.com`). Works in Node 18+, edge runtimes, and the browser (uses the global `fetch`).

## Installation

```bash
npm install infyrence
```

## Quick Start

```typescript
import { Infyrence, creditsUsed } from 'infyrence';

const client = new Infyrence({ apiKey: 'sk-...' });

// Non-streaming chat completion
const response = await client.chat.completions.create({
  model: 'gemini-2.5-flash',
  messages: [{ role: 'user', content: 'Hello!' }],
});
console.log(response.choices[0].message.content);
console.log(response.usage.total_tokens, 'tokens =', creditsUsed(response.usage.total_tokens), 'credits');

// Streaming chat completion
const stream = client.chat.completions.createStream({
  model: 'gemini-2.5-flash',
  messages: [{ role: 'user', content: 'Tell me a story' }],
});
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
  if (chunk.usage) console.log('\n', chunk.usage.total_tokens, 'tokens'); // final chunk
}

// List available models
const models = await client.models.list();
models.forEach((m) => console.log(m.id, '·', m.provider));
```

> **Billing is credit-based: 1 credit = 1000 tokens.** New accounts start with 50 complimentary credits. Use `creditsUsed(usage.total_tokens)` to convert.

Common model ids: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`. With the relevant provider enabled: `llama-3.3-70b`, `qwen-3-32b`, `gpt-oss-120b` (Cerebras), `qwen-max` (Alibaba), and namespaced ids like `meta/llama-4-maverick-17b-128e-instruct` (NVIDIA).

## Configuration

```typescript
const client = new Infyrence({
  apiKey: 'sk-...',           // Required
  baseURL: 'https://...',     // Optional, defaults to https://api.infyrence.com
  timeout: 60000,             // Optional, defaults to 60s
});
```

## API

### `client.chat.completions.create(params)`
Create a chat completion (non-streaming). **Params:** `{ model, messages, temperature?, top_p?, max_tokens?, stop?, frequency_penalty?, presence_penalty?, n?, seed? }`

### `client.chat.completions.createStream(params)`
Streaming chat completion. Returns an async generator of `ChatCompletionChunk` (the final chunk includes `usage`).

### `client.models.list()`
List available models. Returns `Model[]` (`{ id, object, created, owned_by, provider, capabilities }`).

### `client.health()` / `client.providerHealth()`
Gateway and per-provider health.

## Error Handling

Every error carries `requestId` (also the `X-Request-Id` response header), plus `type` and `code` from the error envelope — quote `requestId` when contacting support.

```typescript
import {
  Infyrence,
  AuthenticationError,
  InsufficientCreditsError,
  ValidationError,
  RateLimitError,
  InfyrenceError,
} from 'infyrence';

try {
  await client.chat.completions.create({ model: 'gemini-2.5-flash', messages: [/* ... */] });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof InsufficientCreditsError) {
    console.error('Out of credits — top up your account');
  } else if (error instanceof ValidationError) {
    console.error('Bad request:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited, retry later');
  } else if (error instanceof InfyrenceError) {
    console.error(`API error: ${error.message} (request_id=${error.requestId})`);
  }
}
```

## License

MIT
