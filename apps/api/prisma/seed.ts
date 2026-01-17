import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    await prisma.user.create({
        data: {
            id: 'demo-user',
            email: 'demo@user.com',
            name: 'Demo User'
        }
    })

    await prisma.order.create({
        data: {
            userId: 'demo-user',
            status: 'shipped',
            tracking: 'TRACK-123'
        }
    })

    // Including Payment seed as per diagram
    // Need to fetch order ID or just hardcode if I could, but UUIDs are auto.
    // Actually, user's seed example used 'ORDER_ID' placeholder.
    // I will fetch the order I just created.
    const order = await prisma.order.findFirst({ where: { userId: 'demo-user' } })
    if (order) {
        await prisma.payment.create({
            data: {
                orderId: order.id,
                amount: 1999,
                status: 'paid'
            }
        })
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
