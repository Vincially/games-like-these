import { app } from './server/app.js';
import { trainingManager } from './server/services/trainingManager.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function shutdown(signal) {
    app.log.info(`Recebido ${signal}, encerrando...`);
    await app.close();
    await trainingManager.shutdown();
    process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://localhost:${PORT}`);
} catch (err) {
    app.log.error(err);
    process.exit(1);
}
