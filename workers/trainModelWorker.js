import { parentPort } from 'node:worker_threads';
import * as tf from '@tensorflow/tfjs-node';
import {avgPool, log, min, oneHot, train, valueAndGrad} from "@tensorflow/tfjs-node";
import {getGameById} from "../server/store/gameStore.js";
import {events as workerEvents} from "../public/src/events/constants.js";

console.log('[trainModelWorker] worker iniciado, backend tfjs:', tf.getBackend());

// Estado mantido em memória depois do treino — guarde aqui tudo que o `recommend`
// vai precisar (o modelo em si, tabelas de mapeamento, normalização, vocabulário de tags...).
let _globalCtx = {};
let _model;

function makeContext(users, games) {
    const ages = users.map(u => u.age);
    const prices = games.map(g => g.price);
    
    const minAge = Math.min(...ages)
    const maxAge = Math.max(...ages)
    
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    const genres = [...new Set(games.map(g => g.genre))]
    const genreIndex = Object.fromEntries(
        genres.map((genres,  index) => {
            return [genres,  index]
        })
    )    
    
    const platforms = [...new Set(games.map(g => g.platform))]
    const platformIndex = Object.fromEntries(
        platforms.map((platform,  index) => {
            return [platform,  index]
        })
    )    
    
    const midAge = minAge + maxAge / 2;
    const ageSums = {}
    const ageCounts = {}
    
    users.forEach(user => {
        user.playedGames.forEach(game => {
            ageSums[game.title] = ageSums[game.title] || 0 + user.age;
            ageCounts[game.title] = (ageCounts[game.title] || 0) + 1;
        })
    })
    
    const gamesAgeNorm = Object.fromEntries(
        games.map(game => {
            const avg = ageCounts[game.title] 
                ? ageSums[game.title] / ageCounts[game.title]
                : midAge;
                
            return [game.title, normalize(avg,  minAge, maxAge)]
        })
    )
        
    return {
        games, 
        users, 
        genreIndex,
        platformIndex,
        gamesAgeNorm,
        minAge,
        maxAge,
        minPrice,
        maxPrice,
        numGenre: genres.length,
        numPlatform: platforms.length,
        dimensions: 2 + genres.length + platforms.length
    };
}

const WEIGHTS =  {
    platform: 0.4, // Recomendará principalmente olhando a plataforma que o usuário usa
    genre: 0.3,
    price: 0.2,
    age: 0.1
}

const normalize = (avg, min,  max) => (avg - min) / (max - min) || 1

const oneHotWeighted = (index,  lenght, weight) => 
     tf.oneHot(index, lenght).cast('float32').mul(weight);


function encodeGame(game, context) {
    
    // normalizando e aplicando o peso no preço
    const price = tf.tensor1d([
        normalize(
            game.price, 
            context.minPrice, 
            context.maxPrice
        ) * WEIGHTS.price
    ])
    
    const age = tf.tensor1d([
        (
            context.gamesAgeNorm[game.title] ?? 0.5
        ) * WEIGHTS.age
    ])
    
    const platform = oneHotWeighted(
        context.platformIndex[game.platform], 
        context.numPlatform, 
        WEIGHTS.platform)
    
    const genre = oneHotWeighted(
        context.genreIndex[game.genre], 
        context.numGenre, 
        WEIGHTS.genre)

    return tf.concat1d([price, age, platform, genre])
}

function encodeUser(user, context) {
    if (user.playedGames.length) {
        return tf.stack(
            user.playedGames.map(
                game => encodeGame(game, context)
            )
        )
            .mean(0)
            .reshape([
                1,
                context.dimensions
            ])
    }
}

function createTrainingData(context) {
    const inputs = []
    const labels = []
    
    context.users.forEach(user => {
        const userVector = encodeUser(user,  context).dataSync()
        context.games.forEach(game => {
            const gameVector = encodeGame(game,  context).dataSync()
            
            const label = user.playedGames.some(
                gamePlayed => gamePlayed.title === game.title
                ? 1
                : 0
            )
            inputs.push([...userVector, ...gameVector])
            labels.push(label)
        })
    })
       
    return  {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor1d(labels),
        inputDimensions: context.dimensions * 2
    }
}

async function configureNetwork(trainData) {
    const model = tf.sequential()
    
    //camada de entrada
    model.add(
        tf.layers.dense({
            inputShape: [trainData.inputDimensions],
            units: 128,
            activation: 'relu'
        })
    )
    
    //camada oculta 1
    tf.layers.dense({
        units: 64,
        activation: 'relu'
    })
    
    //camada oculta 2
    model.add(
        tf.layers.dense({
            units: 32,
            activation: 'relu'
        })
    )
    
    //camada de saída
    model.add(
        tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        })
    )
    
    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    })
    
    await model.fit(trainData.xs,  trainData.ys, {
            epochs: 100,
            batchSize: 32,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    parentPort.postMessage({ 
                        type: workerEvents.trainingLog,
                        data: {
                            epoch: epoch,
                            loss: logs.loss,
                            accuracy: logs.acc
                        }
                    });
                }
            }
        }
    )
    return model;
}

async function trainModel({ users, games }, requestId) {
    // Normalização da base de dados
    
    const context = makeContext(users, games);
    _globalCtx = context;
    
    context.gamesVectors = games.map(game => {
        return {
            title: game.title,
            meta: {...game},
            vector: encodeGame(game, context).dataSync()
        }
    })

    const trainData = createTrainingData(context);
    _model = await configureNetwork(trainData);
    
    postMessage({type: workerEvents.progressUpdate, progress: {
        progress: 100 }});
    postMessage({type: workerEvents.trainingComplete});
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
