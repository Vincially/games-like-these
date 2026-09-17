import { app } from './server/app.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://localhost:${PORT}`);
} catch (err) {
    app.log.error(err);
    process.exit(1);
}
