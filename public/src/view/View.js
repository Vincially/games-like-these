export class View {
    #templateCache = new Map();

    async loadTemplate(path) {
        if (this.#templateCache.has(path)) {
            return this.#templateCache.get(path);
        }

        const res = await fetch(path);
        const html = await res.text();
        this.#templateCache.set(path, html);
        return html;
    }

    renderTemplate(template, data) {
        return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
            const value = data[key];
            return value === undefined || value === null ? '' : value;
        });
    }
}
