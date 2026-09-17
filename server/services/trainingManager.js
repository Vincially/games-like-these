import { Worker } from 'node:worker_threads';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getAllGames } from '../store/gameStore.js';
import { getAllUsers } from '../store/userStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.join(__dirname, '..', '..', 'workers', 'trainModelWorker.js');

const RECOMMEND_TIMEOUT_MS = 10_000;

class TrainingManager extends EventEmitter {
    #worker;
    #pending = new Map();
    #trained = false;
    #trainingInProgress = false;

    constructor() {
        super();
        this.#worker = new Worker(workerPath, { type: 'module' });
        this.#worker.on('message', (message) => this.#handleWorkerMessage(message));
        this.#worker.on('error', (err) => {
            this.#trainingInProgress = false;
            this.emit('error', { message: err.message });
        });
    }

    shutdown() {
        return this.#worker.terminate();
    }

    isTrained() {
        return this.#trained;
    }

    isTraining() {
        return this.#trainingInProgress;
    }

    startTraining() {
        if (this.#trainingInProgress) {
            return { started: false, reason: 'training already in progress' };
        }

        this.#trainingInProgress = true;
        const requestId = randomUUID();
        this.#worker.postMessage({
            action: 'train',
            requestId,
            payload: { users: getAllUsers(), games: getAllGames() },
        });

        return { started: true, requestId };
    }

    recommend(userId) {
        return new Promise((resolve, reject) => {
            const requestId = randomUUID();

            const timeout = setTimeout(() => {
                this.#pending.delete(requestId);
                reject(new Error('Worker did not respond in time'));
            }, RECOMMEND_TIMEOUT_MS);

            this.#pending.set(requestId, { resolve, reject, timeout });

            this.#worker.postMessage({
                action: 'recommend',
                requestId,
                payload: { userId },
            });
        });
    }

    #handleWorkerMessage(message) {
        const { type, data } = message;

        switch (type) {
            case 'progressUpdate':
                this.emit('progress', data);
                break;
            case 'trainingLog':
                this.emit('log', data);
                break;
            case 'trainingComplete':
                this.#trained = true;
                this.#trainingInProgress = false;
                this.emit('complete', data);
                break;
        }
    }
}

export const trainingManager = new TrainingManager();
