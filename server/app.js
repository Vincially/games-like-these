import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gamesRoutes } from './routes/games.routes.js';
import { usersRoutes } from './routes/users.routes.js';
import { trainingRoutes } from './routes/training.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

export const app = Fastify({ logger: true });

app.get('/api/health', async () => ({ ok: true }));

await app.register(gamesRoutes, { prefix: '/api/games' });
await app.register(usersRoutes, { prefix: '/api/users' });
await app.register(trainingRoutes, { prefix: '/api' });

await app.register(fastifyStatic, { root: publicDir });
