export class ModelTrainingView {
    #trainButton;
    #recommendButton;
    #progressBar;
    #statusText;

    constructor({ trainButtonId, recommendButtonId, progressBarId, statusTextId }) {
        this.#trainButton = document.getElementById(trainButtonId);
        this.#recommendButton = document.getElementById(recommendButtonId);
        this.#progressBar = document.getElementById(progressBarId);
        this.#statusText = document.getElementById(statusTextId);
    }

    onTrainClick(handler) {
        this.#trainButton.addEventListener('click', handler);
    }

    onRecommendClick(handler) {
        this.#recommendButton.addEventListener('click', handler);
    }

    setTraining(isTraining) {
        this.#trainButton.disabled = isTraining;
        this.#trainButton.innerHTML = isTraining
            ? '<span class="spinner-border spinner-border-sm me-1"></span>Training...'
            : 'Train Model';
    }

    setRecommendEnabled(enabled) {
        this.#recommendButton.disabled = !enabled;
    }

    setProgress(percent) {
        this.#progressBar.style.width = `${percent}%`;
        this.#progressBar.textContent = `${percent}%`;
    }

    setStatus(message) {
        this.#statusText.textContent = message;
    }
}
