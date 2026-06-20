export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.animationId = null;
        this.lastTime = 0;

        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    init() {
        this.score = 0;
        this.isGameOver = false;

        this.bird = {
            x: 80,
            y: this.canvas.height / 2,
            radius: 12,
            velocity: 0,
            color: '#f4b400'
        };

        this.pipes = [];
        this.pipeSpawnTimer = 0;
        
        this.gravity = 1000;
        this.jumpStrength = -320;
        this.pipeSpeed = 160;
        this.pipeSpawnRate = 1.6;
        this.pipeGap = 130;

        this.draw();
    }

    startGame(onGameOverCallback) {
        this.onGameOver = onGameOverCallback;

        document.addEventListener('keydown', this.handleKeyDown);

        this.lastTime = performance.now();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = window.requestAnimationFrame(this.gameLoop.bind(this));
    }

    endGame() {
        this.isGameOver = true;
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            this.bird.velocity = this.jumpStrength;
        }
    }

    gameLoop(currentTime) {
        if (this.isGameOver) return;

        let dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        if (dt > 0.1) dt = 0.1;

        this.update(dt);
        this.draw();

        this.animationId = window.requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(dt) {
        this.bird.velocity += this.gravity * dt;
        this.bird.y += this.bird.velocity * dt;

        this.pipeSpawnTimer += dt;
        if (this.pipeSpawnTimer >= this.pipeSpawnRate) {
            let minHeight = 50;
            let maxHeight = this.canvas.height - this.pipeGap - 50;
            let height = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;

            this.pipes.push({
                x: this.canvas.width,
                topHeight: height,
                bottomY: height + this.pipeGap,
                width: 50,
                passed: false
            });
            this.pipeSpawnTimer = 0;
        }

        let birdRect = {
            x: this.bird.x - this.bird.radius,
            y: this.bird.y - this.bird.radius,
            width: this.bird.radius * 2,
            height: this.bird.radius * 2
        };

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            let pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed * dt;

            if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
                this.score += 1;
                pipe.passed = true;
            }

            let topPipeRect = {
                x: pipe.x,
                y: 0,
                width: pipe.width,
                height: pipe.topHeight
            };

            let bottomPipeRect = {
                x: pipe.x,
                y: pipe.bottomY,
                width: pipe.width,
                height: this.canvas.height - pipe.bottomY
            };

            if (this.checkCollision(birdRect, topPipeRect) || this.checkCollision(birdRect, bottomPipeRect)) {
                this.endGame();
                if (this.onGameOver) this.onGameOver(this.score);
                return;
            }

            if (pipe.x + pipe.width < 0) {
                this.pipes.splice(i, 1);
            }
        }

        if (this.bird.y + this.bird.radius > this.canvas.height || this.bird.y - this.bird.radius < 0) {
            this.endGame();
            if (this.onGameOver) this.onGameOver(this.score);
        }
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    draw() {
        this.ctx.fillStyle = '#70c5ce';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = this.bird.color;
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x, this.bird.y, this.bird.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#2ecc71';
        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 3;

        this.pipes.forEach(pipe => {
            this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
            this.ctx.strokeRect(pipe.x, -5, pipe.width, pipe.topHeight + 5);

            let bottomHeight = this.canvas.height - pipe.bottomY;
            this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, bottomHeight);
            this.ctx.strokeRect(pipe.x, pipe.bottomY, pipe.width, bottomHeight + 5);
        });

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Montserrat, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Счет: ${this.score}`, 10, 10);
    }
}