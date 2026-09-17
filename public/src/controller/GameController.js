import { Events } from '../events/events.js';
import { events } from '../events/constants.js';

export class GameController {
    #gameService;
    #catalogView;
    #recommendationsView;

    constructor(gameService, catalogView, recommendationsView) {
        this.#gameService = gameService;
        this.#catalogView = catalogView;
        this.#recommendationsView = recommendationsView;

        this.#recommendationsView.renderEmpty('Select a user, train the model and click "Run Recommendation".');

        Events.on(events.recommendationsReady, (e) => this.#handleRecommendationsReady(e.detail));
    }

    async init() {
        const games = await this.#gameService.getGames();
        await this.#catalogView.render(games);
    }

    async #handleRecommendationsReady({ recommendations }) {
        if (!recommendations.length) {
            this.#recommendationsView.renderEmpty(
                'No recommendations yet — implement the neural network in workers/trainModelWorker.js.',
            );
            return;
        }

        await this.#recommendationsView.render(recommendations);
    }
}
