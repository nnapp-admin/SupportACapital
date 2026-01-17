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
    const intent = (routing.intent === 'order' || routing.intent === 'billing' || routing.intent === 'support')
        ? routing.intent
        : 'support'

    // @ts-ignore: Stale prisma types
    const agentConfig = await prisma.agent.findUnique({ where: { id: intent } })

    const system = `
${agentConfig?.instructions || 'You are a helpful Customer Support Agent.'}

IMPORTANT:
You MUST always respond with a final message to the user.
Do not end your reasoning without a reply.
`
    let tools = {}

    switch (intent) {
        case 'order':
            tools = createOrderTools(userId)
            break
        case 'billing':
            tools = createBillingTools(userId)
            break
        default:
            // Support agent has no extra tools currently
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
            let assistantMessages =
                result.response?.messages ??
                (result.text
                    ? [{ role: 'assistant', content: result.text }]
                    : [])

            if (assistantMessages.length === 0) {
                assistantMessages = [{
                    role: 'assistant',
                    content: intent === 'order'
                        ? 'I can help you with your order. Please share your order ID or registered email.'
                        : intent === 'billing'
                            ? 'I can help with billing issues. Could you describe the problem?'
                            : 'How can I assist you today?'
                }]
            }

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

    return { stream, routing: { agent: intent, reasoning: routing.reasoning } }
}
