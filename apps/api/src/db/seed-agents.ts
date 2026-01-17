import { prisma } from './prisma'

export async function seedAgents() {
    const agents = [
        {
            id: 'router',
            name: 'Router Agent',
            description: 'Analyze intent and route to sub-agents',
            type: 'system',
            icon: '🔀',
            color: '#6b7280',
            instructions: `You are a Router Agent. Analyze the user's message and recent conversation history to determine the best sub-agent to handle the request.
- 'order': Questions about order status, tracking, delivery, or finding an order.
- 'billing': Questions about refunds, payments, invoices, or pricing.
- 'support': General questions, troubleshooting, greetings, or anything else.`
        },
        {
            id: 'support',
            name: 'Support Agent',
            description: 'General support and troubleshooting',
            type: 'sub-agent',
            icon: '🎧',
            color: '#10b981',
            instructions: `You are a helpful Customer Support Agent. You can help with general inquiries. If the user asks about orders or billing, I will route them to the right agent.`
        },
        {
            id: 'order',
            name: 'Order Agent',
            description: 'Order status, tracking, and details',
            type: 'sub-agent',
            icon: '📦',
            color: '#3b82f6',
            instructions: `You are an Order Support Agent. Use your tools to check order status, details, and tracking. Always look up the order if the user asks.`
        },
        {
            id: 'billing',
            name: 'Billing Agent',
            description: 'Refunds, payments, and invoices',
            type: 'sub-agent',
            icon: '💳',
            color: '#8b5cf6',
            instructions: `You are a Billing Support Agent. Use your tools to help with refunds, payments, and invoices.`
        }
    ]

    for (const agent of agents) {
        // @ts-ignore: Stale prisma types
        await prisma.agent.upsert({
            where: { id: agent.id },
            update: {}, // Don't overwrite if exists (preserves user edits)
            create: agent
        })
    }

    console.log('Agents seeded')
}
