import { Events } from '../events/events.js';
import { events } from '../events/constants.js';

export class ModelTrainingController {
    #view;
    #selectedUserId = null;
    #trained = false;

    constructor(view) {
        this.#view = view;

        this.#view.onTrainClick(() => this.#handleTrainClick());
        this.#view.onRecommendClick(() => this.#handleRecommendClick());

        Events.on(events.userSelected, (e) => this.#handleUserSelected(e.detail));
        Events.on(events.progressUpdate, (e) => this.#handleProgress(e.detail));
        Events.on(events.trainingComplete, () => this.#handleTrainingComplete());
        Events.on(events.trainingError, (e) => this.#handleError(e.detail));
        Events.on(events.recommendationsReady, (e) => this.#handleRecommendationsReady(e.detail));
    }

    #handleTrainClick() {
        this.#view.setTraining(true);
        this.#view.setProgress(0);
        this.#view.setStatus('Training...');
        Events.dispatch(events.trainModel);
    }

    #handleRecommendClick() {
        if (!this.#selectedUserId) {
            this.#view.setStatus('Select a user first.');
            return;
        }

        this.#view.setStatus('Fetching recommendations...');
        Events.dispatch(events.recommend, { userId: this.#selectedUserId });
    }

    #handleUserSelected({ userId }) {
        this.#selectedUserId = userId || null;
        this.#updateRecommendButton();
    }

    #handleProgress({ epoch, totalEpochs, progress }) {
        this.#view.setProgress(progress);
        this.#view.setStatus(`Training... epoch ${epoch}/${totalEpochs}`);
    }

    #handleTrainingComplete() {
        this.#trained = true;
        this.#view.setTraining(false);
        this.#view.setStatus('Training complete.');
        this.#updateRecommendButton();
    }

    #handleError({ message }) {
        this.#view.setTraining(false);
        this.#view.setStatus(`Error: ${message}`);
    }

    #handleRecommendationsReady({ recommendations }) {
        this.#view.setStatus(
            recommendations.length
                ? 'Recommendations ready.'
                : 'No recommendations yet — implement the model in workers/trainModelWorker.js.',
        );
    }

    #updateRecommendButton() {
        this.#view.setRecommendEnabled(this.#trained && Boolean(this.#selectedUserId));
    }
}
