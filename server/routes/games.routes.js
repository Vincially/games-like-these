import { getAllGames, getGameById } from '../store/gameStore.js';

export async function gamesRoutes(fastify, opts) {
    fastify.get('/', async () => getAllGames());

    fastify.get('/:id', async (request, reply) => {
        const game = getGameById(request.params.id);
        if (!game) {
            return reply.code(404).send({ error: 'Game not found' });
        }
        return game;
    });
}
