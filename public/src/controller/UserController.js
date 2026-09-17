import { Events } from '../events/events.js';
import { events } from '../events/constants.js';

export class UserController {
    #userService;
    #view;
    #users = [];
    #selectedUserId = null;

    constructor(userService, view) {
        this.#userService = userService;
        this.#view = view;

        Events.on(events.userSelected, (e) => this.#handleUserSelected(e.detail));
        Events.on(events.playAdded, (e) => this.#handlePlayAdded(e.detail));
        Events.on(events.playRemoved, (e) => this.#handlePlayRemoved(e.detail));
    }

    async init() {
        this.#users = await this.#userService.getUsers();
        this.#view.renderUserOptions(this.#users);
    }

    async #handleUserSelected({ userId }) {
        this.#selectedUserId = userId || null;
        const user = this.#users.find((u) => u.id === userId);
        await this.#view.renderUser(user);
    }

    async #handlePlayAdded({ gameId }) {
        if (!this.#selectedUserId) return;

        const updatedUser = await this.#userService.addPlay(this.#selectedUserId, gameId);
        this.#replaceUser(updatedUser);
        await this.#view.renderUser(updatedUser);
    }

    async #handlePlayRemoved({ gameId }) {
        if (!this.#selectedUserId) return;

        const updatedUser = await this.#userService.removePlay(this.#selectedUserId, gameId);
        this.#replaceUser(updatedUser);
        await this.#view.renderUser(updatedUser);
    }

    #replaceUser(updatedUser) {
        this.#users = this.#users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    }
}
