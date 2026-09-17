export class Events {
    static on(eventName, handler) {
        document.addEventListener(eventName, handler);
    }

    static off(eventName, handler) {
        document.removeEventListener(eventName, handler);
    }

    static dispatch(eventName, detail) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}
