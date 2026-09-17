import { Events } from '../events/events.js';
import { events } from '../events/constants.js';

export class TFVisorController {
    #view;

    constructor(view) {
        this.#view = view;

        Events.on(events.trainModel, () => {
            this.#view.reset();
            this.#view.show();
        });

        Events.on(events.trainingLog, (e) => this.#view.pushLog(e.detail));
    }
}
