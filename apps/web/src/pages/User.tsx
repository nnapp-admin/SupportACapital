import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getConversations, getConversation, streamChat } from '../api/client'

export default function User() {
    const [conversations, setConversations] = useState<any[]>([])
    const [activeId, setActiveId] = useState<string | undefined>(undefined)
    const [messages, setMessages] = useState<any[]>([])
    const [localInput, setLocalInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentRouting, setCurrentRouting] = useState<{ agent: string; reasoning: string } | null>(null)
    const [viewMode, setViewMode] = useState<'user' | 'admin'>('admin')

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
            // Auto-select first chat if activeId is undefined
            if (data && data.length > 0 && !activeId) {
                setActiveId(data[0].id)
            }
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

    const renderContent = (content: any) => {
        // Handle string content
        if (typeof content === 'string') {
            return content
        }

        // Handle array content (AI SDK messages with tool calls)
        if (Array.isArray(content)) {
            return content.map((part, i) => {
                if (typeof part === 'string') {
                    return <span key={i}>{part}</span>
                }

                if (part.type === 'text') {
                    return <span key={i}>{part.text}</span>
                }

                // Only show tool calls in Admin View
                if (part.type === 'tool-call') {
                    if (viewMode === 'user') return null
                    return (
                        <div key={i} style={styles.toolCall}>
                            🔧 Calling tool: <strong>{part.toolName}</strong>
                        </div>
                    )
                }

                // Only show tool results in Admin View
                if (part.type === 'tool-result') {
                    if (viewMode === 'user') return null
                    return (
                        <div key={i} style={styles.toolResult}>
                            ✅ Tool completed
                        </div>
                    )
                }

                return null
            })
        }

        // Handle object content - try to extract text or stringify
        if (typeof content === 'object' && content !== null) {
            if (content.text) {
                return content.text
            }
            return JSON.stringify(content)
        }

        return String(content)
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
                <div style={styles.navHeader}>
                    <Link to="/" style={styles.navLinkActive}>
                        💬 User Chat
                    </Link>
                    <Link to="/admin" style={styles.navLink}>
                        ⚙️ Admin
                    </Link>
                </div>

                <div style={styles.divider} />

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

            {/* User Details Sidebar */}
            {activeId && (
                <aside style={styles.userDetailsSidebar}>
                    <div style={styles.userDetailsHeader}>
                        <div style={styles.userAvatar}>
                            👤
                        </div>
                        <div>
                            <h3 style={styles.userName}>Demo User</h3>
                            <p style={styles.userEmail}>demo-user@example.com</p>
                        </div>
                    </div>

                    <div style={styles.userStats}>
                        <div style={styles.statItem}>
                            <div style={styles.statLabel}>Conversation ID</div>
                            <div style={styles.statValue}>{activeId.slice(0, 8)}...</div>
                        </div>
                        <div style={styles.statItem}>
                            <div style={styles.statLabel}>Total Messages</div>
                            <div style={styles.statValue}>{messages.length}</div>
                        </div>
                        {currentRouting && (
                            <div style={styles.statItem}>
                                <div style={styles.statLabel}>Current Agent</div>
                                <div style={{
                                    ...styles.statValue,
                                    color: getAgentColor(currentRouting.agent)
                                }}>
                                    {currentRouting.agent.toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            )}

            {/* Chat Area */}
            <main style={styles.main}>
                {/* View Mode Toggle */}
                <div style={styles.viewToggleHeader}>
                    <div style={styles.viewTabs}>
                        <button
                            onClick={() => setViewMode('user')}
                            style={viewMode === 'user' ? styles.viewTabActive : styles.viewTab}
                        >
                            View as User
                        </button>
                        <button
                            onClick={() => setViewMode('admin')}
                            style={viewMode === 'admin' ? styles.viewTabActive : styles.viewTab}
                        >
                            View as Admin
                        </button>
                    </div>
                </div>

                {/* Routing Banner - Only in Admin Mode */}
                {viewMode === 'admin' && currentRouting && (
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

                {/* Messages List */}
                <div style={styles.messageList}>
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
                                {renderContent(m.content)}
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
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
    },

    navHeader: {
        display: 'flex',
        gap: 8,
        marginBottom: 16
    },

    navLink: {
        flex: 1,
        textDecoration: 'none',
        color: '#6b7280',
        padding: '8px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        border: '1px solid transparent',
        transition: 'all 0.2s'
    },

    navLinkActive: {
        flex: 1,
        textDecoration: 'none',
        color: '#111827',
        background: '#f3f4f6',
        padding: '8px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        border: '1px solid #e5e7eb'
    },

    divider: {
        height: 1,
        background: '#e5e7eb',
        margin: '0 0 16px 0'
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

    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        background: '#91919136' // Faint orange/yellow background
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

    userDetailsSidebar: {
        width: 280,
        borderRight: '1px solid #e5e7eb',
        padding: 20,
        background: '#fff',
        overflowY: 'auto'
    },

    userDetailsHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        paddingBottom: 20,
        borderBottom: '2px solid #e5e7eb'
    },

    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24
    },

    userName: {
        margin: 0,
        fontSize: 16,
        fontWeight: 600,
        color: '#111827'
    },

    userEmail: {
        margin: '4px 0 0 0',
        fontSize: 13,
        color: '#6b7280'
    },

    userStats: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
    },

    statItem: {
        padding: 12,
        background: '#f9fafb',
        borderRadius: 8,
        border: '1px solid #e5e7eb'
    },

    statLabel: {
        fontSize: 11,
        fontWeight: 600,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 6
    },

    statValue: {
        fontSize: 15,
        fontWeight: 600,
        color: '#111827'
    },

    toolCall: {
        fontSize: 12,
        padding: '6px 10px',
        background: '#fef3c7',
        color: '#92400e',
        borderRadius: 6,
        marginTop: 6,
        display: 'inline-block'
    },

    toolResult: {
        fontSize: 12,
        padding: '6px 10px',
        background: '#d1fae5',
        color: '#065f46',
        borderRadius: 6,
        marginTop: 6,
        display: 'inline-block'
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
    },

    viewToggleHeader: {
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'center'
    },

    viewTabs: {
        display: 'flex',
        background: '#f3f4f6',
        padding: 4,
        borderRadius: 8,
        gap: 4
    },

    viewTab: {
        padding: '6px 16px',
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        fontSize: 13,
        fontWeight: 500,
        color: '#6b7280',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },

    viewTabActive: {
        padding: '6px 16px',
        borderRadius: 6,
        border: 'none',
        background: '#fff',
        fontSize: 13,
        fontWeight: 600,
        color: '#111827',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.2s'
    },

    messageList: {
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 16
    }
}
