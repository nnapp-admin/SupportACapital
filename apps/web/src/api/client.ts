const API_BASE = '/api'

export async function streamChat(
    message: string,
    conversationId: string | null,
    onChunk: (t: string) => void,
    onRouting?: (routing: { agent: string; reasoning: string }) => void
) {
    const res = await fetch(`${API_BASE}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'demo-user',
            message,
            conversationId,
        }),
    })

    if (!res.ok || !res.body) {
        throw new Error('Failed to stream chat')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let isFirstChunk = true

    while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse routing metadata from first line
        if (isFirstChunk && buffer.includes('\n')) {
            const firstLineEnd = buffer.indexOf('\n')
            const firstLine = buffer.slice(0, firstLineEnd)
            buffer = buffer.slice(firstLineEnd + 1)
            isFirstChunk = false

            try {
                const parsed = JSON.parse(firstLine)
                if (parsed.type === 'routing' && onRouting) {
                    onRouting(parsed.data)
                }
            } catch (e) {
                // If not JSON, treat as regular text
                onChunk(firstLine + '\n')
            }
        }

        if (!isFirstChunk && buffer) {
            onChunk(buffer)
            buffer = ''
        }
    }

    // Send any remaining buffer
    if (buffer) {
        onChunk(buffer)
    }
}

export async function getConversations() {
    const res = await fetch(`${API_BASE}/chat/conversations?userId=demo-user`)
    return res.json()
}

export async function getConversation(id: string) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`)
    return res.json()
}

export async function resetConversations() {
    const res = await fetch(`${API_BASE}/chat/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user' })
    })
    return res.json()
}
