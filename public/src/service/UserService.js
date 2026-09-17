export class UserService {
    async getUsers() {
        const res = await fetch('/api/users');
        return res.json();
    }

    async addPlay(userId, gameId, liked = true) {
        const res = await fetch(`/api/users/${userId}/plays`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, liked }),
        });
        return res.json();
    }

    async removePlay(userId, gameId) {
        const res = await fetch(`/api/users/${userId}/plays/${gameId}`, {
            method: 'DELETE',
        });
        return res.json();
    }
}
