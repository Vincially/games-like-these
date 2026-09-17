import { trainingManager } from '../services/trainingManager.js';

export async function trainingRoutes(fastify, opts) {
    fastify.post('/train', async (request, reply) => {
        const result = trainingManager.startTraining();

        if (!result.started) {
            return reply.code(409).send({ error: result.reason });
        }

        return reply.code(202).send({ status: 'training-started' });
    });

    fastify.get('/train/stream', (request, reply) => {
        reply.hijack();

        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        });
        reply.raw.write('\n');

        const send = (event, data) => {
            reply.raw.write(`event: ${event}\n`);
            reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        const onProgress = (data) => send('progress', data);
        const onLog = (data) => send('log', data);
        const onComplete = (data) => send('complete', data);
        const onError = (data) => send('error', data);

        trainingManager.on('progress', onProgress);
        trainingManager.on('log', onLog);
        trainingManager.on('complete', onComplete);
        trainingManager.on('error', onError);

        request.raw.on('close', () => {
            trainingManager.off('progress', onProgress);
            trainingManager.off('log', onLog);
            trainingManager.off('complete', onComplete);
            trainingManager.off('error', onError);
        });
    });

    fastify.post('/recommend', async (request, reply) => {
        const { userId } = request.body;
        if (userId === undefined) {
            return reply.code(400).send({ error: 'userId is required' });
        }

        if (!trainingManager.isTrained()) {
            return reply.code(409).send({ error: 'Model has not been trained yet' });
        }

        try {
            return await trainingManager.recommend(userId);
        } catch (err) {
            return reply.code(504).send({ error: err.message });
        }
    });
}
