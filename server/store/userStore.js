import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getGameById } from './gameStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'data', 'users.json');

let users = JSON.parse(readFileSync(seedPath, 'utf-8'));

export function getAllUsers() {
    return users;
}

export function getUserById(id) {
    return users.find((user) => user.id === Number(id));
}

export function addPlayedGame(userId, gameId, liked = true) {
    const user = getUserById(userId);
    if (!user) return null;

    const game = getGameById(gameId);
    if (!game) return null;

    const alreadyPlayed = user.playedGames.some((played) => played.id === game.id);
    if (!alreadyPlayed) {
        user.playedGames.push({ ...game, liked });
    }

    return user;
}

export function removePlayedGame(userId, gameId) {
    const user = getUserById(userId);
    if (!user) return null;

    user.playedGames = user.playedGames.filter((played) => played.id !== Number(gameId));
    return user;
}
