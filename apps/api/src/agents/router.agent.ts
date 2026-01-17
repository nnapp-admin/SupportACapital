import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

import { prisma } from '../db/prisma';

const model = google('gemini-2.5-flash');

export async function routeAgent(message: string, history: any[] = []) {
    // @ts-ignore: Stale prisma types
    const agentConfig = await prisma.agent.findUnique({ where: { id: 'router' } })

    // Fallback if DB not ready
    const systemInstruction = agentConfig?.instructions || `You are a Router Agent. Analyze the user's message and recent conversation history to determine the best sub-agent to handle the request.
        - 'order': Questions about order status, tracking, delivery, or finding an order.
        - 'billing': Questions about refunds, payments, invoices, or pricing.
        - 'support': General questions, troubleshooting, greetings, or anything else.`

    const { object } = await generateObject({
        model,
        schema: z.object({
            intent: z.enum(['support', 'order', 'billing']),
            reasoning: z.string(),
        }),
        system: systemInstruction,
        messages: [
            ...history,
            { role: 'user', content: message }
        ]
    });

    return object
}

