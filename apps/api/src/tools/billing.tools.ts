import { prisma } from '../db/prisma'

export function getPaymentsByUser(userId: string) {
    return prisma.payment.findMany({ where: { order: { userId } } })
}
