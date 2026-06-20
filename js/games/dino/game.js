export default class DinoGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.isGameOver = false;
        this.score = 0;
        this.animationId = null;

        this.groundY = 320;
        this.dino = {
            x: 50,
            y: this.groundY - 40,
            width: 32,
            height: 40,
            vy: 0,
            gravity: 0.6,
            jumpForce: -12,
            isJumping: false
        };

        this.isJumpPressed = false;
        this.obstacles = [];
        this.clouds = [];
        this.stars = [];
        this.groundPebbles = [];
        this.obstacleTimer = 0;
        this.gameSpeed = 5;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.generateStaticBackground();
    }

    generateStaticBackground() {
        this.stars = [];
        for (let i = 0; i < 25; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 200,
                size: 1 + Math.random() * 1.5
            });
        }
    }

    init() {
        this.isGameOver = false;
        this.score = 0;
        this.gameSpeed = 5;
        this.obstacles = [];
        this.obstacleTimer = 0;

        this.dino.y = this.groundY - this.dino.height;
        this.dino.vy = 0;
        this.dino.isJumping = false;
        this.isJumpPressed = false;

        this.clouds = [
            { x: 100, y: 60, size: 20, speed: 0.2 },
            { x: 300, y: 100, size: 15, speed: 0.15 }
        ];

        this.groundPebbles = [];
        for (let i = 0; i < 10; i++) {
            this.groundPebbles.push({
                x: Math.random() * this.canvas.width,
                y: this.groundY + 4 + Math.random() * 60,
                width: 4 + Math.random() * 8
            });
        }

        this.draw();
    }

    startGame(onGameOverCallback) {
        this.onGameOver = onGameOverCallback;

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        this.canvas.addEventListener('mousedown', this.handleTouchStart);
        this.canvas.addEventListener('mouseup', this.handleTouchEnd);
        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('touchend', this.handleTouchEnd);

        this.gameLoop();
    }

    endGame() {
        this.isGameOver = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousedown', this.handleTouchStart);
        this.canvas.removeEventListener('mouseup', this.handleTouchEnd);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }

    handleKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            this.isJumpPressed = true;
            this.jump();
        }
    }

    handleKeyUp(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            this.isJumpPressed = false;
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.isJumpPressed = true;
        this.jump();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.isJumpPressed = false;
    }

    jump() {
        if (!this.dino.isJumping) {
            this.dino.vy = this.dino.jumpForce;
            this.dino.isJumping = true;
        }
    }

    gameLoop() {
        if (this.isGameOver) return;

        this.update();
        this.draw();

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.score += 0.15;
        this.gameSpeed += 0.001;

        this.dino.vy += this.dino.gravity;

        if (!this.isJumpPressed && this.dino.vy < -3) {
            this.dino.vy = -3;
        }

        this.dino.y += this.dino.vy;

        if (this.dino.y >= this.groundY - this.dino.height) {
            this.dino.y = this.groundY - this.dino.height;
            this.dino.vy = 0;
            this.dino.isJumping = false;
        }

        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.size * 3 < 0) {
                cloud.x = this.canvas.width + 50;
                cloud.y = 40 + Math.random() * 80;
            }
        }

        if (this.clouds.length < 3 && Math.random() < 0.005) {
            this.clouds.push({
                x: this.canvas.width + 50,
                y: 40 + Math.random() * 80,
                size: 12 + Math.random() * 10,
                speed: 0.1 + Math.random() * 0.15
            });
        }

        for (let i = 0; i < this.groundPebbles.length; i++) {
            const pebble = this.groundPebbles[i];
            pebble.x -= this.gameSpeed;
            if (pebble.x + pebble.width < 0) {
                pebble.x = this.canvas.width + Math.random() * 50;
                pebble.y = this.groundY + 4 + Math.random() * 60;
            }
        }

        this.obstacleTimer++;

        let canSpawn = true;
        const minGap = 160 + this.gameSpeed * 10;

        if (this.obstacles.length > 0) {
            const lastObstacle = this.obstacles[this.obstacles.length - 1];
            if (this.canvas.width - lastObstacle.x < minGap) {
                canSpawn = false;
            }
        }

        if (canSpawn && this.obstacleTimer > 60 && Math.random() < 0.015) {
            const height = 25 + Math.random() * 25;
            const width = 20 + Math.random() * 10;
            this.obstacles.push({
                x: this.canvas.width,
                y: this.groundY - height,
                width: width,
                height: height
            });
            this.obstacleTimer = 0;
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.gameSpeed;

            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
                continue;
            }

            const hitboxPaddingX = 6;
            const hitboxPaddingY = 4;
            if (
                this.dino.x + hitboxPaddingX < obs.x + obs.width &&
                this.dino.x + this.dino.width - hitboxPaddingX > obs.x &&
                this.dino.y + hitboxPaddingY < obs.y + obs.height &&
                this.dino.y + this.dino.height > obs.y
            ) {
                this.triggerGameOver();
                return;
            }
        }
    }

    triggerGameOver() {
        this.endGame();
        if (this.onGameOver) {
            this.onGameOver(Math.floor(this.score));
        }
    }

    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#100a1c');
        gradient.addColorStop(0.7, '#221f25');
        gradient.addColorStop(1, '#2f2d31');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'rgba(243, 231, 242, 0.4)';
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        }

        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];
            this.drawCloud(cloud.x, cloud.y, cloud.size);
        }

        this.ctx.strokeStyle = '#2f2d31';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();

        this.ctx.fillStyle = '#2f2d31';
        for (let i = 0; i < this.groundPebbles.length; i++) {
            const pebble = this.groundPebbles[i];
            this.ctx.fillRect(pebble.x, pebble.y, pebble.width, 2);
        }

        this.drawDino(this.dino.x, this.dino.y, this.dino.width, this.dino.height);

        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            this.drawCactus(obs.x, obs.y, obs.width, obs.height);
        }

        this.ctx.fillStyle = '#f3e7f2';
        this.ctx.font = '16px Montserrat, sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Счет: ${Math.floor(this.score)}`, this.canvas.width - 20, 30);
    }

    drawCloud(x, y, size) {
        this.ctx.fillStyle = 'rgba(243, 231, 242, 0.15)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.6, y - size * 0.3, size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x + size * 1.2, y, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawDino(x, y, w, h) {
        this.ctx.fillStyle = '#80bd88';

        this.ctx.fillRect(x + 4, y + 12, 18, 16);
        this.ctx.fillRect(x + 10, y + 4, 11, 10);
        this.ctx.fillRect(x + 10, y, 18, 8);
        this.ctx.fillRect(x, y + 14, 6, 8);
        this.ctx.fillRect(x + 2, y + 22, 4, 4);

        this.ctx.fillStyle = '#4d8054';
        this.ctx.fillRect(x + 18, y + 14, 6, 4);

        this.ctx.fillStyle = '#221f25';
        this.ctx.fillRect(x + 14, y + 2, 2, 2);

        const frame = Math.floor(performance.now() / 100) % 2;
        this.ctx.fillStyle = '#80bd88';
        if (this.dino.isJumping) {
            this.ctx.fillRect(x + 6, y + 28, 4, 6);
            this.ctx.fillRect(x + 16, y + 28, 4, 6);
        } else {
            if (frame === 0) {
                this.ctx.fillRect(x + 6, y + 28, 4, 12);
                this.ctx.fillRect(x + 16, y + 28, 4, 6);
            } else {
                this.ctx.fillRect(x + 6, y + 28, 4, 6);
                this.ctx.fillRect(x + 16, y + 28, 4, 12);
            }
        }
    }

    drawCactus(x, y, w, h) {
        this.ctx.fillStyle = '#be6672';

        const stemW = Math.max(6, Math.floor(w * 0.3));
        const stemX = x + Math.floor((w - stemW) / 2);
        this.ctx.fillRect(stemX, y, stemW, h);
        this.ctx.fillRect(stemX, y, stemW, h);

        const branchY1 = y + Math.floor(h * 0.35);
        const branchH1 = Math.floor(h * 0.35);
        this.ctx.fillRect(x, branchY1, stemX - x, 4);
        this.ctx.fillRect(x, y + Math.floor(h * 0.15), 4, branchH1);

        const branchY2 = y + Math.floor(h * 0.45);
        const branchH2 = Math.floor(h * 0.3);
        const rightOffset = stemX + stemW;
        this.ctx.fillRect(rightOffset, branchY2, (x + w) - rightOffset, 4);
        this.ctx.fillRect(x + w - 4, y + Math.floor(h * 0.25), 4, branchH2);
    }
}