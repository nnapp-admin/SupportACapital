import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { routeAgent } from '../agents/router.agent'
import { createOrderTools } from '../agents/order.agent'
import { createBillingTools } from '../agents/billing.agent'
import { prisma } from '../db/prisma'

const model = google('gemini-2.5-flash')

export async function handleChat(userId: string, message: string, conversationId?: string) {
    let conversation;

    if (conversationId) {
        conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
    }

    if (!conversation) {
        // Only find latest if no specific ID requested (or if specific one not found? No, if specific requested and not found, creates new? Or error?)
        // Let's say if ID not provided, try to find latest.
        if (!conversationId) {
            conversation = await prisma.conversation.findFirst({
                where: { userId },
                // @ts-ignore: updatedAt exists in schema but missing in generated types
                orderBy: { updatedAt: 'desc' }
            })
        }
    }

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                userId,
                messages: [] as any
            }
        })
    }

    const history = conversation.messages as unknown as any[] || []

    // Route based on history + new message
    const routing = await routeAgent(message, history)

    // Safety fallback: ensure routing result is valid
    const intent = (routing === 'order' || routing === 'billing' || routing === 'support')
        ? routing
        : 'support'

    let tools = {}
    let system = ''

    switch (intent) {
        case 'order':
            tools = createOrderTools(userId)
            system = 'You are an Order Support Agent. Use your tools to check order status, details, and tracking. Always look up the order if the user asks.'
            break
        case 'billing':
            tools = createBillingTools(userId)
            system = 'You are a Billing Support Agent. Use your tools to help with refunds, payments, and invoices.'
            break
        default:
            system = 'You are a helpful Customer Support Agent. You can help with general inquiries. If the user asks about orders or billing, I will route them to the right agent.'
            break
    }

    const stream = streamText({
        model,
        // @ts-ignore: Stale type definition
        maxSteps: 5,
        system,
        tools,
        messages: [
            ...(history.map((m: any) => ({ role: m.role, content: m.content })) as any),
            { role: 'user', content: message }
        ],
        onFinish: async (result) => {
            const assistantMessages =
                result.response?.messages ??
                (result.text
                    ? [{ role: 'assistant', content: result.text }]
                    : [])

            const newMsgs = [
                { role: 'user', content: message },
                ...assistantMessages
            ]

            await prisma.conversation.update({
                where: { id: conversation!.id },
                data: {
                    messages: [...history, ...newMsgs] as any
                }
            })
        }
    })

    return stream
}
