import { useState, useEffect } from 'react'
import { getConversations, getConversation, streamChat } from '../api/client'

export default function User() {
    const [conversations, setConversations] = useState<any[]>([])
    const [activeId, setActiveId] = useState<string | undefined>(undefined)
    const [messages, setMessages] = useState<any[]>([])
    const [localInput, setLocalInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        loadConversations()
    }, [])

    useEffect(() => {
        if (activeId) {
            loadMessages(activeId)
        } else {
            setMessages([])
        }
    }, [activeId])

    async function loadConversations() {
        try {
            const data = await getConversations()
            setConversations(data)
        } catch (e) {
            console.error(e)
        }
    }

    async function loadMessages(id: string) {
        try {
            const data = await getConversation(id)
            const dbMessages = Array.isArray(data.messages) ? data.messages : JSON.parse(data.messages)
            setMessages(dbMessages)
        } catch (e) {
            console.error(e)
        }
    }

    const onCreateChat = () => {
        setActiveId(undefined)
        setMessages([])
    }

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!localInput.trim() || isLoading) return

        const content = localInput
        setLocalInput('')
        setIsLoading(true)

        const userMessage = { id: Date.now().toString(), role: 'user', content }
        setMessages(prev => [...prev, userMessage])

        try {
            const assistantId = (Date.now() + 1).toString()
            const assistantMessage = { id: assistantId, role: 'assistant', content: '' }
            setMessages(prev => [...prev, assistantMessage])

            let fullContent = ''
            await streamChat(content, activeId || null, (chunk) => {
                fullContent += chunk
                setMessages(prev => {
                    const next = [...prev]
                    const idx = next.findIndex(m => m.id === assistantId)
                    if (idx !== -1) {
                        next[idx] = { ...next[idx], content: fullContent }
                    }
                    return next
                })
            })

            await loadConversations()
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'system', content: 'Error sending message.' }])
        } finally {
            setIsLoading(false)
        }
    }

    const renderContent = (content: any) => {
        if (typeof content === 'string') return content
        if (Array.isArray(content)) {
            return content.map((c, i) => {
                if (c.type === 'text') return <span key={i}>{c.text}</span>
                if (c.type === 'tool-call') return <div key={i} style={{ fontSize: '0.8em', color: '#888' }}>Running tool: {c.toolName}...</div>
                if (c.type === 'tool-result') return <div key={i} style={{ fontSize: '0.8em', color: '#888' }}>Tool Finished</div>
                return null
            })
        }
        return JSON.stringify(content)
    }

    return (
        <div style={{ display: 'flex', height: '90vh' }}>
            {/* Sidebar */}
            <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '1rem', overflowY: 'auto' }}>
                <button
                    onClick={onCreateChat}
                    style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}
                >
                    + New Chat
                </button>
                {conversations.map(c => (
                    <div
                        key={c.id}
                        onClick={() => setActiveId(c.id)}
                        style={{
                            padding: '0.5rem',
                            cursor: 'pointer',
                            backgroundColor: activeId === c.id ? '#f0f0f0' : 'transparent',
                            marginBottom: '0.5rem',
                            border: '1px solid #eee',
                            borderRadius: '4px'
                        }}
                    >
                        {new Date(c.updatedAt).toLocaleString()}
                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                            Chat {c.id.slice(0, 8)}...
                        </div>
                    </div>
                ))}
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', border: '1px solid #eee', padding: '1rem', borderRadius: '4px' }}>
                    {messages.map((m: any) => (
                        <div key={m.id} style={{ marginBottom: '1rem', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                            <div style={{
                                display: 'inline-block',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                backgroundColor: m.role === 'user' ? '#007bff' : '#f1f1f1',
                                color: m.role === 'user' ? 'white' : 'black',
                                maxWidth: '70%'
                            }}>
                                <strong>{m.role === 'user' ? 'You' : 'Agent'}:</strong><br />
                                {renderContent(m.content)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ display: 'inline-block', padding: '0.5rem', backgroundColor: '#f1f1f1', borderRadius: '8px' }}>
                                <em>Agent is typing...</em>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSend} style={{ display: 'flex' }}>
                    <input
                        value={localInput}
                        onChange={e => setLocalInput(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', marginRight: '0.5rem' }}
                        placeholder="Type a message..."
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading} style={{ padding: '0.5rem 1rem' }}>Send</button>
                </form>
            </div>
        </div>
    )
}
