import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Agent {
    id: string
    name: string
    description: string
    icon: string
    color: string
    instructions: string
}

// @ts-ignore: Vite env
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export default function Admin() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        fetchAgents()
    }, [])

    async function fetchAgents() {
        try {
            const res = await fetch(`${API_BASE}/agents/agents`)
            const data = await res.json()
            setAgents(data)
        } catch (e) {
            console.error('Failed to load agents', e)
        }
    }

    const handleEditStart = (agent: Agent) => {
        setEditingId(agent.id)
        setEditValue(agent.instructions)
    }

    const handleCancel = () => {
        setEditingId(null)
        setEditValue('')
    }

    const handleSave = async (id: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`${API_BASE}/agents/agents/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instructions: editValue })
            })

            if (res.ok) {
                const updated = await res.json()
                setAgents(prev => prev.map(a => a.id === id ? updated : a))
                setEditingId(null)
            } else {
                alert('Failed to save changes')
            }
        } catch (e) {
            console.error(e)
            alert('Error saving changes')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddAgent = () => {
        const id = `custom-${Date.now()}`
        const newAgent: Agent = {
            id,
            name: 'New Custom Agent',
            description: 'Description of the new agent',
            icon: '🤖',
            color: '#f59e0b',
            instructions: 'You are a custom agent...'
        }
        setAgents([...agents, newAgent])
    }

    return (
        <div style={styles.app}>
            {/* Sidebar (Same as User.tsx) */}
            <aside style={styles.sidebar}>
                <div style={styles.navHeader}>
                    <Link to="/" style={styles.navLink}>
                        💬 User Chat
                    </Link>
                    <Link to="/admin" style={styles.navLinkActive}>
                        ⚙️ Admin
                    </Link>
                </div>

                <div style={styles.divider} />

                <div style={styles.sidebarNote}>
                    <p>Manage your AI workforce here. Configure agent personalities and instructions.</p>
                </div>
            </aside>

            {/* Main Content */}
            <main style={styles.main}>
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Agent Management</h1>
                        <p style={styles.subtitle}>Configure system prompts and active agents</p>
                    </div>
                    <button onClick={handleAddAgent} style={styles.addBtn}>
                        + Add Agent
                    </button>
                </div>

                <div style={styles.grid}>
                    {agents.map(agent => (
                        <div key={agent.id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div style={{ ...styles.iconBox, background: agent.color }}>
                                    {agent.icon}
                                </div>
                                <div style={styles.agentInfo}>
                                    <div style={styles.agentName}>{agent.name}</div>
                                    <div style={styles.agentDesc}>{agent.description}</div>
                                </div>
                            </div>

                            <div style={styles.instructionSection}>
                                <label style={styles.label}>System Instructions (Prompt)</label>

                                {editingId === agent.id ? (
                                    <div style={styles.editWrapper}>
                                        <div style={styles.disclaimer}>
                                            ⚠️ Changing these instructions will immediately affect how this agent behaves in live conversations.
                                        </div>
                                        <textarea
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            style={{ ...styles.textarea, minHeight: '200px' }}
                                            disabled={isLoading}
                                        />
                                        <div style={styles.actionButtons}>
                                            <button
                                                onClick={handleCancel}
                                                style={styles.cancelBtn}
                                                disabled={isLoading}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSave(agent.id)}
                                                style={styles.saveBtn}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={styles.readOnlyPrompt}>
                                            {agent.instructions}
                                        </div>
                                        <button
                                            onClick={() => handleEditStart(agent)}
                                            style={styles.editBtn}
                                        >
                                            ✏️ Edit Instructions
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}

// Consistent styles with User.tsx
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
    sidebarNote: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 1.5,
        padding: 12,
        background: '#f9fafb',
        borderRadius: 8
    },
    main: {
        flex: 1,
        padding: 40,
        overflowY: 'auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        color: '#111827',
        margin: '0 0 8px 0'
    },
    subtitle: {
        color: '#6b7280',
        fontSize: 14
    },
    addBtn: {
        background: '#111827',
        color: '#fff',
        border: 'none',
        padding: '10px 16px',
        borderRadius: 8,
        fontWeight: 500,
        cursor: 'pointer',
        fontSize: 14
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: 24
    },
    card: {
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.2s'
    },
    cardHeader: {
        display: 'flex',
        gap: 16,
        marginBottom: 20,
        alignItems: 'flex-start'
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        color: '#fff',
        flexShrink: 0
    },
    agentInfo: {
        flex: 1
    },
    agentName: {
        fontWeight: 600,
        fontSize: 16,
        color: '#111827',
        marginBottom: 4
    },
    agentDesc: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 1.4
    },
    instructionSection: {
        marginTop: 16
    },
    label: {
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    textarea: {
        width: '100%',
        padding: 12,
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: '#f9fafb',
        fontSize: 13,
        lineHeight: 1.6,
        color: '#111827',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    },
    readOnlyPrompt: {
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        lineHeight: 1.6,
        color: '#4b5563',
        whiteSpace: 'pre-wrap',
        fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        maxHeight: '200px',
        overflowY: 'auto'
    },
    editBtn: {
        marginTop: 12,
        background: '#fff',
        border: '1px solid #e5e7eb',
        padding: '8px 12px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        color: '#374151',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6
    },
    editWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
    },
    disclaimer: {
        fontSize: 12,
        color: '#92400e',
        background: '#fef3c7',
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid #fcd34d',
        lineHeight: 1.4
    },
    actionButtons: {
        display: 'flex',
        gap: 8,
        justifyContent: 'flex-end'
    },
    cancelBtn: {
        background: 'transparent',
        border: 'none',
        color: '#6b7280',
        padding: '8px 16px',
        borderRadius: 6,
        fontSize: 13,
        cursor: 'pointer',
        fontWeight: 500
    },
    saveBtn: {
        background: '#111827',
        color: '#fff',
        border: 'none',
        padding: '8px 16px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer'
    }
}
