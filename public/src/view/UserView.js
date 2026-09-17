import { View } from './View.js';
import { Events } from '../events/events.js';
import { events } from '../events/constants.js';

export class UserView extends View {
    #select;
    #ageField;
    #playedList;

    constructor({ selectId, ageFieldId, playedListId }) {
        super();
        this.#select = document.getElementById(selectId);
        this.#ageField = document.getElementById(ageFieldId);
        this.#playedList = document.getElementById(playedListId);

        this.#select.addEventListener('change', () => {
            Events.dispatch(events.userSelected, { userId: Number(this.#select.value) });
        });

        this.#playedList.addEventListener('click', (e) => this.#handlePlayedListClick(e));
    }

    renderUserOptions(users) {
        this.#select.innerHTML = ['<option value="">Select a user...</option>']
            .concat(users.map((user) => `<option value="${user.id}">${user.name}</option>`))
            .join('');
    }

    async renderUser(user) {
        if (!user) {
            this.#ageField.value = '';
            this.#playedList.innerHTML = '';
            return;
        }

        this.#ageField.value = user.age;

        const template = await this.loadTemplate('/src/view/templates/past-play.html');
        this.#playedList.innerHTML = user.playedGames.map((game) => this.renderTemplate(template, {
            ...game,
            likedIcon: game.liked ? 'bi-hand-thumbs-up-fill text-success' : 'bi-hand-thumbs-down text-secondary',
        })).join('') || '<li class="list-group-item text-muted">No games played yet.</li>';
    }

    #handlePlayedListClick(e) {
        const button = e.target.closest('[data-action="remove-play"]');
        if (!button) return;

        Events.dispatch(events.playRemoved, { gameId: Number(button.dataset.gameId) });
    }
}
