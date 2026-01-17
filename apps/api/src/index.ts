import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'

import { chatController } from './chat/chat.controller'
import { agentsController } from './agents/agents.controller'
import { healthRoute } from './health/health.route'
import { errorMiddleware } from './middleware/error'

/**
 * Create Hono app
 */
const app = new Hono()

/**
 * API namespace
 */
const api = new Hono()

api.route('/chat', chatController)
api.route('/agents', agentsController)
api.route('/health', healthRoute)

/**
 * Global middleware
 */
app.use('*', cors())
app.use('*', errorMiddleware)

/**
 * Mount API
 */
app.route('/api', api)

/**
 * ================================
 * Server bootstrap (WATCH-SAFE)
 * ================================
 */

const port = Number(process.env.PORT) || 3001

declare global {
    // Prevent double server start in tsx watch / Windows
    // eslint-disable-next-line no-var
    var __HONO_SERVER_STARTED__: boolean | undefined
}

import { seedAgents } from './db/seed-agents'

if (!global.__HONO_SERVER_STARTED__) {
    global.__HONO_SERVER_STARTED__ = true

    // Seed agents on startup
    seedAgents().catch(console.error)

    serve({
        fetch: app.fetch,
        port,
    })

    console.log(`Server is running on port ${port}`)
}

export default app
