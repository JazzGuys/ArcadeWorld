const http = require("http");
const handleRequest = require('./router');

const PORT = 3000;

const server = http.createServer((req, res) => {
    handleRequest(req, res);
});

server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});