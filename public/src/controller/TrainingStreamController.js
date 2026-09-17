import { Events } from '../events/events.js';
import { events } from '../events/constants.js';

export class TrainingStreamController {
    #trainingService;

    constructor(trainingService) {
        this.#trainingService = trainingService;

        this.#trainingService.subscribeToStream({
            onProgress: (data) => Events.dispatch(events.progressUpdate, data),
            onLog: (data) => Events.dispatch(events.trainingLog, data),
            onComplete: (data) => Events.dispatch(events.trainingComplete, data),
            onError: (data) => Events.dispatch(events.trainingError, data),
        });

        Events.on(events.trainModel, () => this.#handleTrainModel());
        Events.on(events.recommend, (e) => this.#handleRecommend(e.detail));
    }

    async #handleTrainModel() {
        try {
            await this.#trainingService.train();
        } catch (err) {
            Events.dispatch(events.trainingError, { message: err.message });
        }
    }

    async #handleRecommend({ userId }) {
        try {
            const result = await this.#trainingService.recommend(userId);
            Events.dispatch(events.recommendationsReady, result);
        } catch (err) {
            Events.dispatch(events.trainingError, { message: err.message });
        }
    }
}
