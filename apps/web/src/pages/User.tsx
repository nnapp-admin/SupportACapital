import { useState, useEffect } from 'react'
import { getConversations, getConversation, streamChat } from '../api/client'

export default function User() {
    const [conversations, setConversations] = useState<any[]>([])
    const [activeId, setActiveId] = useState<string | undefined>(undefined)
    const [messages, setMessages] = useState<any[]>([])
    const [localInput, setLocalInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentRouting, setCurrentRouting] = useState<{ agent: string; reasoning: string } | null>(null)

    useEffect(() => {
        loadConversations()
    }, [])

    useEffect(() => {
        if (activeId) loadMessages(activeId)
        else setMessages([])
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
            const dbMessages = Array.isArray(data.messages)
                ? data.messages
                : JSON.parse(data.messages)
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
            setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

            let fullContent = ''
            await streamChat(
                content,
                activeId || null,
                chunk => {
                    fullContent += chunk
                    setMessages(prev =>
                        prev.map(m => (m.id === assistantId ? { ...m, content: fullContent } : m))
                    )
                },
                routing => {
                    setCurrentRouting(routing)
                }
            )

            await loadConversations()
        } catch (error) {
            console.error(error)
            setMessages(prev => [
                ...prev,
                { id: `error-${Date.now()}`, role: 'system', content: 'Error sending message.' }
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const getAgentColor = (agent: string) => {
        switch (agent) {
            case 'order':
                return '#3b82f6' // Blue
            case 'billing':
                return '#8b5cf6' // Purple
            case 'support':
                return '#10b981' // Green
            default:
                return '#6b7280' // Gray
        }
    }

    return (
        <div style={styles.app}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <button onClick={onCreateChat} style={styles.newChatBtn}>
                    + New Chat
                </button>

                {conversations.map(c => (
                    <div
                        key={c.id}
                        onClick={() => setActiveId(c.id)}
                        style={{
                            ...styles.conversationItem,
                            background:
                                activeId === c.id ? '#f4f4f5' : 'transparent'
                        }}
                    >
                        <div style={styles.conversationDate}>
                            {new Date(c.updatedAt).toLocaleString()}
                        </div>
                        <div style={styles.conversationId}>
                            {c.id.slice(0, 8)}…
                        </div>
                    </div>
                ))}
            </aside>

            {/* Chat */}
            <main style={styles.chat}>
                {/* Routing Info Banner */}
                {currentRouting && (
                    <div style={styles.routingBanner}>
                        <div style={styles.routingHeader}>
                            <div style={styles.routingIcon}>
                                {currentRouting.agent === 'order' && '📦'}
                                {currentRouting.agent === 'billing' && '💳'}
                                {currentRouting.agent === 'support' && '🎧'}
                            </div>
                            <div>
                                <div style={styles.routingTitle}>
                                    Handled by:{' '}
                                    <span style={{
                                        ...styles.agentBadge,
                                        background: getAgentColor(currentRouting.agent)
                                    }}>
                                        {currentRouting.agent.toUpperCase()} Agent
                                    </span>
                                </div>
                                <div style={styles.routingReasoning}>
                                    {currentRouting.reasoning}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={styles.messages}>
                    {messages.map(m => (
                        <div
                            key={m.id}
                            style={{
                                ...styles.messageRow,
                                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <div
                                style={{
                                    ...styles.bubble,
                                    background:
                                        m.role === 'user' ? '#111827' : '#f4f4f5',
                                    color: m.role === 'user' ? '#fff' : '#111'
                                }}
                            >
                                {m.content}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div style={styles.messageRow}>
                            <div style={{ ...styles.bubble, opacity: 0.6 }}>
                                Typing…
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSend} style={styles.inputBar}>
                    <input
                        value={localInput}
                        onChange={e => setLocalInput(e.target.value)}
                        placeholder="Type a message…"
                        disabled={isLoading}
                        style={styles.input}
                    />
                    <button disabled={isLoading} style={styles.sendBtn}>
                        Send
                    </button>
                </form>
            </main>
        </div>
    )
}

/* =======================
   Minimal modern styles
   ======================= */

const styles: Record<string, React.CSSProperties> = {
    app: {
        display: 'flex',
        height: '100vh',
        background: '#fafafa',
        fontFamily: 'Inter, system-ui, sans-serif'
    },

    sidebar: {
        width: 280,
        borderRight: '1px solid #e5e7eb',
        padding: 16,
        background: '#fff',
        overflowY: 'auto'
    },

    newChatBtn: {
        width: '100%',
        padding: '10px 12px',
        marginBottom: 16,
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: '#fff',
        cursor: 'pointer',
        fontWeight: 500
    },

    conversationItem: {
        padding: 12,
        borderRadius: 8,
        cursor: 'pointer',
        marginBottom: 8
    },

    conversationDate: {
        fontSize: 12,
        color: '#6b7280'
    },

    conversationId: {
        fontSize: 13,
        color: '#111827',
        marginTop: 4
    },

    chat: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 20
    },

    messages: {
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 16
    },

    messageRow: {
        display: 'flex',
        marginBottom: 12
    },

    bubble: {
        maxWidth: '70%',
        padding: '10px 14px',
        borderRadius: 14,
        fontSize: 14,
        lineHeight: 1.4
    },

    inputBar: {
        display: 'flex',
        gap: 8,
        borderTop: '1px solid #e5e7eb',
        paddingTop: 12
    },

    input: {
        flex: 1,
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        outline: 'none',
        fontSize: 14
    },

    sendBtn: {
        padding: '10px 16px',
        borderRadius: 10,
        border: 'none',
        background: '#111827',
        color: '#fff',
        fontWeight: 500,
        cursor: 'pointer'
    },

    routingBanner: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },

    routingHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
    },

    routingIcon: {
        fontSize: 32,
        lineHeight: 1
    },

    routingTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#fff',
        marginBottom: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 8
    },

    agentBadge: {
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        color: '#fff',
        display: 'inline-block',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },

    routingReasoning: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 1.5,
        fontStyle: 'italic'
    }
}
