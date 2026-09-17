export class GameService {
    async getGames() {
        const res = await fetch('/api/games');
        return res.json();
    }
}
