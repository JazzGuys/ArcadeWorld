const http = require("http");

const PORT = 3000;

const server = http.createServer((req, res) => {
    res.end(JSON.stringify({ data: 'leven' }));
});

server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});