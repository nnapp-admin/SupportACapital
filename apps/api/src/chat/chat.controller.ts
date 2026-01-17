import { Hono } from 'hono'
import { handleChat } from './chat.service'
import { prisma } from '../db/prisma'

export const chatController = new Hono()

chatController.post('/messages', async (c) => {
    try {
        const { userId, message, conversationId } = await c.req.json()

        if (!userId || !message) {
            return c.json({ error: 'userId and message are required' }, 400)
        }

        const result = await handleChat(userId, message, conversationId)

        /**
         * IMPORTANT:
         * We must stream TEXT, not objects.
         * streamText() returns DefaultStreamTextResult
         */
        const textStream = result.textStream

        return new Response(textStream, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Agent-Type': 'ai-support',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })
    } catch (error) {
        console.error('Chat error:', error)
        return c.json({ error: 'Internal server error' }, 500)
    }
})

chatController.get('/conversations', async (c) => {
    const userId = c.req.query('userId') || 'demo-user'

    const conversations = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 50,
    })

    return c.json(conversations)
})

chatController.get('/conversations/:id', async (c) => {
    const id = c.req.param('id')

    const conversation = await prisma.conversation.findUnique({
        where: { id },
    })

    if (!conversation) {
        return c.json({ error: 'Not found' }, 404)
    }

    return c.json(conversation)
})

chatController.delete('/conversations/:id', async (c) => {
    const id = c.req.param('id')
    await prisma.conversation.delete({ where: { id } })
    return c.json({ success: true })
})
