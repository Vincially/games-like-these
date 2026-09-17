import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'data', 'games.json');

let games = JSON.parse(readFileSync(seedPath, 'utf-8'));

export function getAllGames() {
    return games;
}

export function getGameById(id) {
    return games.find((game) => game.id === Number(id));
}
