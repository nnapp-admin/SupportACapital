const API_BASE = '/api'

export async function streamChat(
    message: string,
    conversationId: string | null,
    onChunk: (t: string) => void
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

    while (true) {
        const { value, done } = await reader.read()
        if (done) break
        onChunk(decoder.decode(value))
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
