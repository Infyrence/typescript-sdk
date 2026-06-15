# infyrence

TypeScript SDK for the Infyrence AI inference API.

## Installation

```bash
npm install infyrence
```

## Quick Start

```typescript
import { Infyrence } from 'infyrence';

const client = new Infyrence({ apiKey: 'sk-...' });

// Non-streaming chat completion
const response = await client.chat.completions.create({
  model: 'gemini-2-flash',
  messages: [{ role: 'user', content: 'Hello!' }],
});
console.log(response.choices[0].message.content);

// Streaming chat completion
const stream = await client.chat.completions.createStream({
  model: 'gemini-2-flash',
  messages: [{ role: 'user', content: 'Tell me a story' }],
});
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}

// List available models
const models = await client.models.list();
models.forEach(m => console.log(m.name, m.provider));

// Health check
const health = await client.health();
console.log(health.status);
```

## Configuration

```typescript
const client = new Infyrence({
  apiKey: 'sk-...',           // Required
  baseURL: 'https://...',     // Optional, defaults to Infyrence API
  timeout: 60000,             // Optional, defaults to 60s
});
```

## API

### `client.chat.completions.create(params)`

Create a chat completion (non-streaming).

**Params:** `{ model, messages, temperature?, top_p?, max_tokens?, stop?, frequency_penalty?, presence_penalty?, n?, seed? }`

### `client.chat.completions.createStream(params)`

Create a streaming chat completion. Returns an async generator yielding `ChatCompletionChunk` objects.

### `client.models.list()`

List available models. Returns `Model[]`.

### `client.health()`

Check API health status.

### `client.providerHealth()`

Check provider health status.

## Error Handling

```typescript
import { Infyrence, AuthenticationError, RateLimitError } from 'infyrence';

try {
  await client.chat.completions.create({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited, retry later');
  }
}
```

## License

MIT
