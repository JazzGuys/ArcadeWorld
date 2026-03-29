const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./database');

const sessions = {};

const parseBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
    });
};

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

async function handleRequest(req, res) {
    const {method, url} = req;

    const sendJson = (statusCode, data) => {
        res.writeHead(statusCode, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data));
    };

    if (url.startsWith('/api/')) {
        try {
            if (url === '/api/register' && method === 'POST') {
                const {username, password} = await parseBody(req);
                const users = await db.getUsers();

                if (users.find(u => u.username === username)) {
                    return sendJson(400, {error: 'Пользователь уже существует'});
                }

                users.push({
                    username,
                    password: hashPassword(password)
                });
                await db.saveUsers(users);
                return sendJson(201, {message: 'Регистрация успешна'});
            }

            if (url === '/api/login' && method === 'POST') {
                const {username, password} = await parseBody(req);
                const users = await db.getUsers();

                const user = users.find(u => u.username === username && u.password === hashPassword(password));
                if (!user) {
                    return sendJson(401, {error: 'Неверный логин или пароль'});
                }

                const token = crypto.randomBytes(16).toString('hex');
                sessions[token] = username;

                return sendJson(200, {token, username});
            }

            if (url === '/api/score' && method === 'POST') {
                const {token, game, score} = await parseBody(req);
                const username = sessions[token];

                if (!username) {
                    return sendJson(401, {error: 'Не авторизован'});
                }

                const scores = await db.getScores();
                if (!scores[game]) scores[game] = [];

                scores[game].push({username, score: Number(score), date: new Date().toISOString()});

                scores[game].sort((a, b) => b.score - a.score);
                scores[game] = scores[game].slice(0, 10);

                await db.saveScores(scores);
                return sendJson(200, {message: 'Счет сохранен'});
            }

            if (url.startsWith('/api/leaderboard') && method === 'GET') {
                const urlParams = new URL(req.url, `http://${req.headers.host}`);
                const game = urlParams.searchParams.get('game');

                const scores = await db.getScores();
                return sendJson(200, scores[game] || []);
            }

            return sendJson(404, {error: 'API метод не найден'});

        } catch (error) {
            console.error('API Error:', error);
            return sendJson(500, {error: 'Внутренняя ошибка сервера'});
        }
    }

    let filePath = path.join(__dirname, '../public', url === '/' ? 'index.html' : url);

    const extname = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.ico': 'image/x-icon'
    };
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'});
                res.end('<h1>404: Файл не найден</h1>');
            } else {
                res.writeHead(500);
                res.end(`Ошибка сервера: ${error.code}`);
            }
        } else {
            res.writeHead(200, {'Content-Type': contentType});
            res.end(content, 'utf-8');
        }
    });
}

module.exports = handleRequest;