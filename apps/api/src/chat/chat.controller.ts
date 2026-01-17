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

        const { stream, routing } = await handleChat(userId, message, conversationId)

        // Create a custom stream that sends metadata first, then text
        const encoder = new TextEncoder()
        const textStream = stream.textStream

        const customStream = new ReadableStream({
            async start(controller) {
                // Send routing metadata as first chunk
                const metadata = JSON.stringify({ type: 'routing', data: routing }) + '\n'
                controller.enqueue(encoder.encode(metadata))

                // Then stream the text
                const reader = textStream.getReader()
                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        controller.enqueue(value)
                    }
                } finally {
                    reader.releaseLock()
                    controller.close()
                }
            }
        })

        return new Response(customStream, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Agent-Type': routing.agent,
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

chatController.post('/reset', async (c) => {
    try {
        const { userId } = await c.req.json()

        if (!userId) {
            return c.json({ error: 'userId is required' }, 400)
        }

        const result = await prisma.conversation.deleteMany({
            where: { userId }
        })

        return c.json({
            success: true,
            message: `Deleted ${result.count} conversation(s) for user ${userId}`,
            deletedCount: result.count
        })
    } catch (error) {
        console.error('Reset error:', error)
        return c.json({ error: 'Failed to reset conversations' }, 500)
    }
})
