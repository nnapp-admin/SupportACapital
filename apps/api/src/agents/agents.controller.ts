import { Hono } from 'hono'

export const agentsController = new Hono()

// GET /agents/agents - List available agents
agentsController.get('/agents', (c) => {
    return c.json([
        { id: 'router', name: 'Router Agent', type: 'system', description: 'Routes queries to appropriate sub-agents' },
        { id: 'support', name: 'Support Agent', type: 'sub-agent', description: 'Handles general support inquiries' },
        { id: 'order', name: 'Order Agent', type: 'sub-agent', description: 'Handles order status and tracking' },
        { id: 'billing', name: 'Billing Agent', type: 'sub-agent', description: 'Handles payments and refunds' }
    ])
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
