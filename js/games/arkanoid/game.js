const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 640;

class Game {
    constructor(options = {}) {
        this.canvas = options.canvas || document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = options.scoreEl || null;
        this.statusEl = options.statusEl || null;
        this.actionButton = options.actionButton || null;
        this.onGameOver = options.onGameOver || null;

        this.width = this.canvas.width || DEFAULT_WIDTH;
        this.height = this.canvas.height || DEFAULT_HEIGHT;
        this.frameId = null;
        this.running = false;
        this.gameOver = false;
        this.lastTime = 0;
        this.paddleSpeed = 7;
        this.ballSpeed = 5;
        this.brickRows = 5;
        this.brickCols = 7;
        this.brickGap = 10;
        this.brickTop = 60;
        this.brickPaddingX = 24;
        this.brickHeight = 22;
        this.score = 0;

        this.keys = { left: false, right: false };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.loop = this.loop.bind(this);

        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        this.reset();
    }

    reset() {
        const paddleWidth = 110;
        this.paddle = {
            x: (this.width - paddleWidth) / 2,
            y: this.height - 40,
            width: paddleWidth,
            height: 16
        };

        this.ball = {
            x: this.width / 2,
            y: this.height - 70,
            radius: 8,
            vx: this.ballSpeed,
            vy: -this.ballSpeed
        };

        this.bricks = this.createBricks();
        this.score = 0;
        this.running = false;
        this.gameOver = false;
        this.lastTime = 0;
        this.setScore(0);
        this.setStatus('Готово');
        this.setActionLabel('Начать игру');
        this.draw();
    }

    start() {
        if (this.running) 
            return;

        if (this.gameOver || !this.bricks) {
            this.reset();
        }

        this.running = true;
        this.setStatus('Играем');
        this.setActionLabel('Перезапустить');
        this.frameId = window.requestAnimationFrame(this.loop);
    }

    restart() {
        this.reset();
        this.start();
    }

    destroy() {
        this.running = false;
        this.gameOver = true;

        if (this.frameId) {
            window.cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }

        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    setScore(value) {
        if (this.scoreEl) {
            this.scoreEl.textContent = String(value);
        }
    }

    setStatus(text) {
        if (this.statusEl) {
            this.statusEl.textContent = text;
        }
    }

    setActionLabel(text) {
        if (this.actionButton) {
            this.actionButton.textContent = text;
        }
    }

    handleKeyDown(event) {
        if (event.key === 'ArrowLeft' || event.key === 'a') {
            this.keys.left = true;
        }

        if (event.key === 'ArrowRight' || event.key === 'd') {
            this.keys.right = true;
        }
    }

    handleKeyUp(event) {
        if (event.key === 'ArrowLeft' || event.key === 'a') {
            this.keys.left = false;
        }

        if (event.key === 'ArrowRight' || event.key === 'd') {
            this.keys.right = false;
        }
    }

    createBricks() {
        const bricks = [];
        const brickWidth = (this.width - this.brickPaddingX * 2 - this.brickGap * (this.brickCols - 1)) / this.brickCols;

        for (let row = 0; row < this.brickRows; row += 1) {
            for (let col = 0; col < this.brickCols; col += 1) {
                bricks.push({
                    x: this.brickPaddingX + col * (brickWidth + this.brickGap),
                    y: this.brickTop + row * (this.brickHeight + this.brickGap),
                    width: brickWidth,
                    height: this.brickHeight,
                    alive: true,
                    hits: row < 2 ? 1 : 2
                });
            }
        }

        return bricks;
    }

    loop(currentTime) {
        if (!this.running) return;

        this.frameId = window.requestAnimationFrame(this.loop);

        const delta = (currentTime - this.lastTime) / 16.67;
        if (delta < 1) return;

        this.lastTime = currentTime;
        this.update();
        this.draw();
    }

    update() {
        if (this.keys.left) {
            this.paddle.x = Math.max(0, this.paddle.x - this.paddleSpeed);
        }

        if (this.keys.right) {
            this.paddle.x = Math.min(this.width - this.paddle.width, this.paddle.x + this.paddleSpeed);
        }

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        if (this.ball.x - this.ball.radius <= 0 || this.ball.x + this.ball.radius >= this.width) {
            this.ball.vx *= -1;
            this.ball.x = Math.max(this.ball.radius, Math.min(this.width - this.ball.radius, this.ball.x));
        }

        if (this.ball.y - this.ball.radius <= 0) {
            this.ball.vy *= -1;
            this.ball.y = this.ball.radius;
        }

        const hitPaddle =
            this.ball.y + this.ball.radius >= this.paddle.y &&
            this.ball.y + this.ball.radius <= this.paddle.y + this.paddle.height &&
            this.ball.x >= this.paddle.x &&
            this.ball.x <= this.paddle.x + this.paddle.width &&
            this.ball.vy > 0;

        if (hitPaddle) {
            const hitPoint = (this.ball.x - this.paddle.x) / this.paddle.width - 0.5;
            this.ball.vx = hitPoint * 10;
            this.ball.vy = -Math.abs(this.ball.vy);
            this.ball.y = this.paddle.y - this.ball.radius - 1;
        }

        for (const brick of this.bricks) {
            if (!brick.alive) 
                continue;

            const hitBrick =
                this.ball.x + this.ball.radius >= brick.x &&
                this.ball.x - this.ball.radius <= brick.x + brick.width &&
                this.ball.y + this.ball.radius >= brick.y &&
                this.ball.y - this.ball.radius <= brick.y + brick.height;

            if (hitBrick) {
                brick.hits -= 1;
                this.score += 10;
                this.setScore(this.score);
                this.ball.vy *= -1;

                if (brick.hits <= 0) {
                    brick.alive = false;
                }

                break;
            }
        }

        if (this.ball.y - this.ball.radius > this.height) {
            this.finishGame(false);
            return;
        }

        if (this.bricks.every((brick) => !brick.alive)) {
            this.finishGame(true);
        }
    }

    finishGame(won) {
        this.running = false;
        this.gameOver = true;
        this.setStatus(won ? 'Победа' : 'Поражение');
        this.setActionLabel('Начать заново');

        if (typeof this.onGameOver === 'function') {
            this.onGameOver(this.score);
        }
    }

    draw() {
        this.ctx.fillStyle = '#08111b';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let x = 0; x < this.width; x += 24) {
            this.ctx.fillRect(x, 0, 1, this.height);
        }

        for (const brick of this.bricks) {
            if (!brick.alive) continue;

            this.ctx.fillStyle = brick.hits === 2 ? '#38bdf8' : '#f59e0b';
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }

        this.ctx.fillStyle = '#4ade80';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

        this.ctx.beginPath();
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        this.ctx.strokeRect(0.5, 0.5, this.width - 1, this.height - 1);
    }
}

export default Game;