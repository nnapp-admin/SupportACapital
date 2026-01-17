import { Hono } from 'hono'
import { prisma } from '../db/prisma'

export const agentsController = new Hono()

// GET /agents/agents - List available agents from DB
agentsController.get('/agents', async (c) => {
    // @ts-ignore: Stale prisma types
    const agents = await prisma.agent.findMany({
        orderBy: { name: 'asc' }
    })
    return c.json(agents)
})

// PUT /agents/:id - Update agent instructions
agentsController.put('/agents/:id', async (c) => {
    const id = c.req.param('id')
    const { instructions } = await c.req.json()

    if (!instructions) {
        return c.json({ error: 'Instructions required' }, 400)
    }

    try {
        // @ts-ignore: Stale prisma types
        const agent = await prisma.agent.update({
            where: { id },
            data: { instructions }
        })
        return c.json(agent)
    } catch (e) {
        return c.json({ error: 'Failed to update agent' }, 500)
    }
})

// GET /agents/:type/capabilities - Get agent capabilities (Keep hardcoded for now or move to DB later)
agentsController.get('/:type/capabilities', (c) => {
    const type = c.req.param('type')
    let capabilities: string[] = []

    if (type === 'order') {
        capabilities = ['Check Order Status', 'List Recent Orders', 'Track Delivery']
    } else if (type === 'billing') {
        capabilities = ['Check Refund Status', 'View Invoices', 'Payment Details']
    } else if (type === 'support') {
        capabilities = ['General Inquiries', 'FAQ', 'Troubleshooting']
    } else {
        return c.json({ error: 'Agent type not found' }, 404)
    }

    return c.json({ agent: type, capabilities })
})

// GET /agents/:type/capabilities - Get agent capabilities
agentsController.get('/:type/capabilities', (c) => {
    const type = c.req.param('type')
    let capabilities: string[] = []

    if (type === 'order') {
        capabilities = ['Check Order Status', 'List Recent Orders', 'Track Delivery']
    } else if (type === 'billing') {
        capabilities = ['Check Refund Status', 'View Invoices', 'Payment Details']
    } else if (type === 'support') {
        capabilities = ['General Inquiries', 'FAQ', 'Troubleshooting']
    } else {
        return c.json({ error: 'Agent type not found' }, 404)
    }

    return c.json({ agent: type, capabilities })
})
