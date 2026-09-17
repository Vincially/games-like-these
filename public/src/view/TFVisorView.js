export class TFVisorView {
    #lossHistory = [];
    #accuracyHistory = [];

    reset() {
        this.#lossHistory = [];
        this.#accuracyHistory = [];
    }

    pushLog({ epoch, loss, accuracy }) {
        this.#lossHistory.push({ x: epoch, y: loss ?? 0 });
        this.#accuracyHistory.push({ x: epoch, y: accuracy ?? 0 });

        tfvis.render.linechart(
            { name: 'Training Loss', tab: 'Model Training' },
            { values: [this.#lossHistory], series: ['loss'] },
            { xLabel: 'Epoch', yLabel: 'Loss' },
        );

        tfvis.render.linechart(
            { name: 'Model Accuracy', tab: 'Model Training' },
            { values: [this.#accuracyHistory], series: ['accuracy'] },
            { xLabel: 'Epoch', yLabel: 'Accuracy' },
        );
    }

    show() {
        tfvis.visor().open();
    }
}
