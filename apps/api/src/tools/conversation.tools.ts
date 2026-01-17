import { prisma } from '../db/prisma'

export function getConversationHistory(userId: string) {
    return prisma.conversation.findMany({ where: { userId } })
}
