import { z } from 'zod';
import { tool } from 'ai';
import { getOrdersByUser } from '../tools/order.tools';

export const createOrderTools = (userId: string) => ({
    getOrders: tool({
        description: 'Get a list of recent orders for the current user including status and tracking info.',
        parameters: z.object({}),
        // @ts-ignore
        execute: async () => await getOrdersByUser(userId),
    }),
    checkOrderStatus: tool({
        description: 'Check the status of a specific order by Order ID.',
        parameters: z.object({ orderId: z.string() }),
        // @ts-ignore
        execute: async ({ orderId }: { orderId: string }) => {
            const orders = await getOrdersByUser(userId);
            const order = orders.find(o => o.id === orderId);
            return order ? { status: order.status, tracking: order.tracking } : { error: 'Order not found' };
        }
    })
});

