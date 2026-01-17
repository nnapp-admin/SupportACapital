import { z } from 'zod';
import { tool } from 'ai';
import { getPaymentsByUser } from '../tools/billing.tools';

export const createBillingTools = (userId: string) => ({
    getPayments: tool({
        description: 'Get a list of payments/invoices for the current user.',
        parameters: z.object({}),
        // @ts-ignore
        execute: async () => await getPaymentsByUser(userId),
    }),
    checkRefundStatus: tool({
        description: 'Check refund status for a specific order.',
        parameters: z.object({ orderId: z.string() }),
        // @ts-ignore
        execute: async ({ orderId }: { orderId: string }) => {
            const payments = await getPaymentsByUser(userId);
            // logic to find refund
            const payment = payments.find(p => p.orderId === orderId);
            return payment ? { status: payment.status, amount: payment.amount } : { error: 'Payment not found' };
        }
    })
});

