import { View } from './View.js';
import { Events } from '../events/events.js';
import { events } from '../events/constants.js';

export class GameView extends View {
    #container;

    constructor(containerId) {
        super();
        this.#container = document.getElementById(containerId);
        this.#container.addEventListener('click', (e) => this.#handleClick(e));
    }

    async render(games) {
        const template = await this.loadTemplate('/src/view/templates/game-card.html');
        this.#container.innerHTML = games.map((game) => this.renderTemplate(template, {
            ...game,
            tags: game.tags.join(', '),
        })).join('');
    }

    renderEmpty(message) {
        this.#container.innerHTML = `<p class="text-muted">${message}</p>`;
    }

    #handleClick(e) {
        const button = e.target.closest('[data-action="add-play"]');
        if (!button) return;

        Events.dispatch(events.playAdded, { gameId: Number(button.dataset.gameId) });
    }
}
