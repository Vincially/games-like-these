import { parentPort } from 'node:worker_threads';
import * as tf from '@tensorflow/tfjs-node';

console.log('[trainModelWorker] worker iniciado, backend tfjs:', tf.getBackend());

// Estado mantido em memória depois do treino — guarde aqui tudo que o `recommend`
// vai precisar (o modelo em si, tabelas de mapeamento, normalização, vocabulário de tags...).
let _globalCtx = {
    model: null,
    trained: false,
};

async function trainModel({ users, games }, requestId) {
    // Normalização da base de dadds
      
    
    // TODO 1: transformar `users` (cada um com `.playedGames`, que já vem com
    //         genre/platform/tags/rating/price/liked embutidos) e `games` em
    //         tensores de treino (tf.tensor2d / tf.tensor1d).
    //
    // TODO 2: definir a arquitetura do modelo, ex.:
    //   const model = tf.sequential();
    //   model.add(tf.layers.dense({ inputShape: [N], units: 16, activation: 'relu' }));
    //   model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    //   model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });
    //
    // TODO 3: chamar model.fit(...) usando callbacks.onEpochEnd para postar
    //         progresso/log de volta pra thread principal, por exemplo:
    //
    //   await model.fit(xs, ys, {
    //     epochs: 20,
    //     callbacks: {
    //       onEpochEnd: (epoch, logs) => {
    //         post('progress', requestId, { epoch, totalEpochs: 20, progress: Math.round(((epoch + 1) / 20) * 100) });
    //         post('log', requestId, { epoch, loss: logs.loss, accuracy: logs.acc });
    //       },
    //     },
    //   });
    //
    // TODO 4: guardar o modelo treinado (e tabelas auxiliares) em `_globalCtx`.
    //
    // TODO 5: rodar model.evaluate(...) e reportar as métricas finais no `trainingComplete`.

    // --- placeholder mínimo, só pra o esqueleto funcionar ponta a ponta ---
    post('progress', requestId, { epoch: 0, totalEpochs: 1, progress: 0 });
    await new Promise((resolve) => setTimeout(resolve, 500));
    post('log', requestId, { epoch: 1, loss: null, accuracy: null });
    post('progress', requestId, { epoch: 1, totalEpochs: 1, progress: 100 });

    _globalCtx.trained = true;
    post('trainingComplete', requestId, { epochs: 1, finalLoss: null, finalAccuracy: null });
}

async function recommend({ userId }, requestId) {
    if (!_globalCtx.trained) {
        post('error', requestId, { message: 'Modelo ainda não foi treinado' });
        return;
    }

    // TODO: usar `_globalCtx.model` para prever/ranquear os jogos que o usuário
    // `userId` ainda não jogou, e devolver os top-N como recomendações, ex.:
    //   const recommendations = games
    //     .filter(g => !played.has(g.id))
    //     .map(g => ({ ...g, score: predict(g) }))
    //     .sort((a, b) => b.score - a.score)
    //     .slice(0, 5);
    const recommendations = [];

    post('recommendResult', requestId, { userId, recommendations });
}

function post(type, requestId, data) {
    parentPort.postMessage({ type, requestId, data });
}

const handlers = {
    train: (payload, requestId) => trainModel(payload, requestId),
    recommend: (payload, requestId) => recommend(payload, requestId),
};

parentPort.on('message', ({ action, requestId, payload }) => {
    const handler = handlers[action];
    if (!handler) {
        post('error', requestId, { message: `Ação desconhecida: ${action}` });
        return;
    }

    Promise.resolve(handler(payload, requestId)).catch((err) => {
        post('error', requestId, { message: err.message, stack: err.stack });
    });
});
