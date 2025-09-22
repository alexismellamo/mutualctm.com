import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';
import cookie from '@elysiajs/cookie';
import { prisma } from '@ctm/db';
import { validateSession } from './utils/auth';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { settingsRoutes } from './routes/settings';
import { usersRoutes } from './routes/users';
import { validationRoutes } from './routes/validation';
import { authMiddleware } from './middleware/auth';

const PORT = process.env.API_PORT || 3001;
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];

const app = new Elysia()
  .use(
    cors({
      origin: CORS_ORIGINS,
      credentials: true,
    })
  )
  .use(
    staticPlugin({
      assets: '../../storage',
      prefix: '/storage',
    })
  )
  .use(cookie())
  .get('/', () => ({ message: 'CTM Credenciales API', version: '1.0.0' }))
  .group('/api/v1', (app) =>
    app
      .use(healthRoutes)
      .use(validationRoutes)
      .use(authRoutes)
      .use(settingsRoutes)
      .use(usersRoutes)
  )
  .listen(PORT);

console.log(`🚀 CTM API running at http://localhost:${PORT}`);

export type App = typeof app;
