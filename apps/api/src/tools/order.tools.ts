import { prisma } from '../db/prisma'

export function getOrdersByUser(userId: string) {
    return prisma.order.findMany({ where: { userId } })
}
