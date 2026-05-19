const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

const COLORS = [
    '#111',     // 0 - пусто
    '#00FFFF',  // 1 - I
    '#0000FF',  // 2 - J
    '#FFA500',  // 3 - L
    '#FFFF00',  // 4 - O
    '#00FF00',  // 5 - S
    '#800080',  // 6 - T
    '#FF0000'   // 7 - Z
];

const TETROMINOES = [
    [],
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[2,0,0], [2,2,2], [0,0,0]], // J
    [[0,0,3], [3,3,3], [0,0,0]], // L
    [[4,4], [4,4]], // O
    [[0,5,5], [5,5,0], [0,0,0]], // S
    [[0,6,0], [6,6,6], [0,0,0]], // T
    [[7,7,0], [0,7,7], [0,0,0]]  // Z
];

export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.offsetX = (this.canvas.width - COLS * BLOCK_SIZE) / 2;
        this.offsetY = 0;

        this.animationId = null;
        this.lastTime = 0;
        this.dropCounter = 0;

        this.handleInput = this.handleInput.bind(this);
    }

    init() {
        this.score = 0;
        this.isGameOver = false;
        this.dropInterval = 800;

        this.grid = Array.from({length: ROWS}, () => Array(COLS).fill(0));

        this.spawnPiece();
        this.draw();
    }

    startGame(onGameOverCallback) {
        this.onGameOver = onGameOverCallback;
        document.addEventListener('keydown', this.handleInput);
        this.lastTime = performance.now();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = window.requestAnimationFrame(this.gameLoop.bind(this));
    }

    endGame() {
        this.isGameOver = true;
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.handleInput);
    }

    spawnPiece() {
        const typeId = Math.floor(Math.random() * 7) + 1;
        this.piece = {
            matrix: TETROMINOES[typeId].map(row => [...row]),
            pos: { x: Math.floor(COLS / 2) - 1, y: 0 }
        };

        if (this.collide(this.grid, this.piece)) {
            this.endGame();
            if (this.onGameOver) this.onGameOver(this.score);
        }
    }

    handleInput(e) {
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            this.movePiece(-1);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            this.movePiece(1);
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            this.dropPiece();
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
            this.rotatePiece();
        }
    }

    movePiece(dir) {
        this.piece.pos.x += dir;
        if (this.collide(this.grid, this.piece)) {
            this.piece.pos.x -= dir;
        }
        this.draw();
    }

    dropPiece() {
        this.piece.pos.y++;
        if (this.collide(this.grid, this.piece)) {
            this.piece.pos.y--;
            this.merge(this.grid, this.piece);
            this.clearLines();
            this.spawnPiece();
        }
        this.dropCounter = 0;
        this.draw();
    }

    rotatePiece() {
        const matrix = this.piece.matrix;
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        matrix.forEach(row => row.reverse());

        let offset = 1;
        const pos = this.piece.pos.x;
        while (this.collide(this.grid, this.piece)) {
            this.piece.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > matrix[0].length) {
                // Отмена поворота если не влезли
                matrix.forEach(row => row.reverse());
                for (let y = 0; y < matrix.length; ++y) {
                    for (let x = 0; x < y; ++x) {
                        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
                    }
                }
                this.piece.pos.x = pos;
                return;
            }
        }
        this.draw();
    }

    collide(grid, piece) {
        const m = piece.matrix;
        const o = piece.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (grid[y + o.y] && grid[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    merge(grid, piece) {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    grid[y + piece.pos.y][x + piece.pos.x] = value;
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        outer: for (let y = ROWS - 1; y >= 0; --y) {
            for (let x = 0; x < COLS; ++x) {
                if (this.grid[y][x] === 0) continue outer;
            }
            const row = this.grid.splice(y, 1)[0].fill(0);
            this.grid.unshift(row);
            ++y;
            linesCleared++;
        }

        if (linesCleared > 0) {
            const points = [0, 100, 300, 500, 800]; // 1, 2, 3 или 4 линии
            this.score += points[linesCleared];
            this.dropInterval = Math.max(100, 800 - (this.score / 100) * 20); // Ускорение
        }
    }

    gameLoop(currentTime) {
        if (this.isGameOver) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            this.dropPiece();
        }

        this.animationId = window.requestAnimationFrame(this.gameLoop.bind(this));
    }

    drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.ctx.fillStyle = COLORS[value];
                    this.ctx.fillRect(this.offsetX + (x + offset.x) * BLOCK_SIZE,
                        this.offsetY + (y + offset.y) * BLOCK_SIZE,
                        BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                }
            });
        });
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(this.offsetX, this.offsetY, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

        this.ctx.strokeStyle = '#2f2d31';
        this.ctx.strokeRect(this.offsetX - 1, this.offsetY - 1, COLS * BLOCK_SIZE + 2, ROWS * BLOCK_SIZE + 2);

        this.drawMatrix(this.grid, {x: 0, y: 0});
        if (this.piece) {
            this.drawMatrix(this.piece.matrix, this.piece.pos);
        }
    }
}