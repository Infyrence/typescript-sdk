export async function* parseSSEStream(response) {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Response body is not readable');
    }
    const decoder = new TextDecoder();
    let buffer = '';
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed === '' || trimmed === 'data: [DONE]')
                    continue;
                if (!trimmed.startsWith('data: '))
                    continue;
                const jsonStr = trimmed.slice(6);
                try {
                    const chunk = JSON.parse(jsonStr);
                    yield chunk;
                }
                catch {
                    // Skip malformed JSON lines
                }
            }
        }
        // Process any remaining buffer
        if (buffer.trim() !== '' && buffer.trim() !== 'data: [DONE]' && buffer.startsWith('data: ')) {
            const jsonStr = buffer.trim().slice(6);
            try {
                const chunk = JSON.parse(jsonStr);
                yield chunk;
            }
            catch {
                // Skip malformed JSON
            }
        }
    }
    finally {
        reader.releaseLock();
    }
}
//# sourceMappingURL=streaming.js.map