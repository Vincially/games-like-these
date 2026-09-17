import { getAllUsers, getUserById, addPlayedGame, removePlayedGame } from '../store/userStore.js';

export async function usersRoutes(fastify, opts) {
    fastify.get('/', async () => getAllUsers());

    fastify.get('/:id', async (request, reply) => {
        const user = getUserById(request.params.id);
        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }
        return user;
    });

    fastify.post('/:id/plays', async (request, reply) => {
        const { gameId, liked } = request.body;
        if (gameId === undefined) {
            return reply.code(400).send({ error: 'gameId is required' });
        }

        const user = addPlayedGame(request.params.id, gameId, liked ?? true);
        if (!user) {
            return reply.code(404).send({ error: 'User or game not found' });
        }

        return user;
    });

    fastify.delete('/:id/plays/:gameId', async (request, reply) => {
        const user = removePlayedGame(request.params.id, request.params.gameId);
        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }

        return user;
    });
}
