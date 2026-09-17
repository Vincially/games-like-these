export class TrainingService {
    #eventSource = null;

    async train() {
        const res = await fetch('/api/train', { method: 'POST' });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Training request failed (${res.status})`);
        }
        return res.json();
    }

    async recommend(userId) {
        const res = await fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Recommend request failed (${res.status})`);
        }
        return res.json();
    }

    subscribeToStream({ onProgress, onLog, onComplete, onError }) {
        if (this.#eventSource) return;

        this.#eventSource = new EventSource('/api/train/stream');
        this.#eventSource.addEventListener('progress', (e) => onProgress?.(JSON.parse(e.data)));
        this.#eventSource.addEventListener('log', (e) => onLog?.(JSON.parse(e.data)));
        this.#eventSource.addEventListener('complete', (e) => onComplete?.(JSON.parse(e.data)));
        this.#eventSource.addEventListener('error', (e) => {
            if (e.data) onError?.(JSON.parse(e.data));
        });
    }
}
