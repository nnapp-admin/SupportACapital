import { Context, Next } from 'hono'

export async function errorMiddleware(c: Context, next: Next) {
    try {
        await next()
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
}
