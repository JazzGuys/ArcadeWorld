const CELL_SIZE = 20;

class Vector2 { constructor(x, y) { this.x = x; this.y = y; } }

export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.lastTime = 0;
        this.handleInput = this.handleInput.bind(this);
    }

    init() {
        this.body = [new Vector2(5, 5)];
        this.direction = new Vector2(1, 0);
        this.score = 0;
        this.speed = 10;
        this.isGameOver = false;
        this.spawnFood();
        this.draw();
    }

    startGame(onGameOverCallback) {
        this.onGameOver = onGameOverCallback;
        document.addEventListener('keydown', this.handleInput);
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = window.requestAnimationFrame(this.gameLoop.bind(this));
    }

    endGame() {
        this.isGameOver = true;
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.handleInput);
    }

    handleInput(e) {
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();

        const code = e.code;
        if ((code === 'KeyW' || code === 'ArrowUp') && this.direction.y === 0) { this.direction = new Vector2(0, -1); }
        else if ((code === 'KeyS' || code === 'ArrowDown') && this.direction.y === 0) { this.direction = new Vector2(0, 1); }
        else if ((code === 'KeyA' || code === 'ArrowLeft') && this.direction.x === 0) { this.direction = new Vector2(-1, 0); }
        else if ((code === 'KeyD' || code === 'ArrowRight') && this.direction.x === 0) { this.direction = new Vector2(1, 0); }
    }

    gameLoop(currentTime) {
        if (this.isGameOver) return;
        this.animationId = window.requestAnimationFrame(this.gameLoop.bind(this));

        const secondsSinceLastRender = (currentTime - this.lastTime) / 1000;
        if (secondsSinceLastRender < 1 / this.speed) return;
        this.lastTime = currentTime;

        this.update();
        this.draw();
    }

    update() {
        const head = this.body[0];
        const newHead = new Vector2(head.x + this.direction.x, head.y + this.direction.y);

        if (newHead.x < 0 || newHead.x >= this.canvas.width / CELL_SIZE || newHead.y < 0 || newHead.y >= this.canvas.height / CELL_SIZE) {
            this.triggerGameOver(); return;
        }

        for (let segment of this.body) {
            if (newHead.x === segment.x && newHead.y === segment.y) { this.triggerGameOver(); return; }
        }

        this.body.unshift(newHead);
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += 10;
            if (this.score % 50 === 0) this.speed += 2;
            this.spawnFood();
        } else this.body.pop();
    }

    triggerGameOver() { this.endGame(); if (this.onGameOver) this.onGameOver(this.score); }

    spawnFood() {
        this.food = new Vector2(
            Math.floor(Math.random() * (this.canvas.width / CELL_SIZE)),
            Math.floor(Math.random() * (this.canvas.height / CELL_SIZE))
        );
    }

    draw() {
        this.ctx.fillStyle = '#111'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.body.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#a0e8a9' : '#80bd88';
            this.ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
        });
        this.ctx.fillStyle = '#be6672';
        this.ctx.fillRect(this.food.x * CELL_SIZE, this.food.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    }
}