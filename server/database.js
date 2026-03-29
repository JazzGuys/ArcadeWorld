const fs = require('fs').promises;
const path = require('path');

const usersPath = path.join(__dirname, 'data', 'users.json');
const scoresPath = path.join(__dirname, 'data', 'scores.json');

async function readJson(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Ошибка чтения ${filePath}:`, error);
        return Array.isArray(require(filePath)) ? [] : {}; // Возврат пустого массива или объекта
    }
}

async function writeJson(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data), 'utf8');
    } catch (error) {
        console.error(`Ошибка записи ${filePath}:`, error);
    }
}

module.exports = {
    getUsers: () => readJson(usersPath),
    saveUsers: (data) => writeJson(usersPath, data),
    getScores: () => readJson(scoresPath),
    saveScores: (data) => writeJson(scoresPath, data)
};