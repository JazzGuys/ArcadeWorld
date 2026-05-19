export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.animationId = null;
        this.lastTime = 0;

        this.keys = {};
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    init() {
        this.score = 0;
        this.isGameOver = false;

        this.player = {
            width: 30,
            height: 30,
            x: this.canvas.width / 2 - 15,
            y: this.canvas.height - 40,
            speed: 300,
            color: '#80bd88'
        };

        this.bullets = [];
        this.enemies = [];
        this.stars = [];

        this.bulletSpeed = 400;
        this.fireRate = 0.25;
        this.timeSinceLastShot = 0;

        this.enemySpawnTimer = 0;
        this.baseEnemySpawnRate = 1.0;
        this.difficultyMultiplier = 1.0;

        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 50 + 20
            });
        }

        this.draw();
    }

    startGame(onGameOverCallback) {
        this.onGameOver = onGameOverCallback;

        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);

        this.lastTime = performance.now();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = window.requestAnimationFrame(this.gameLoop.bind(this));
    }

    endGame() {
        this.isGameOver = true;
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.keys = {};
    }

    handleKeyDown(e) {
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
        this.keys[e.code] = true;
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
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
        this.difficultyMultiplier += dt * 0.02;

        if ((this.keys['ArrowLeft'] || this.keys['KeyA']) && this.player.x > 0) {
            this.player.x -= this.player.speed * dt;
        }
        if ((this.keys['ArrowRight'] || this.keys['KeyD']) && this.player.x + this.player.width < this.canvas.width) {
            this.player.x += this.player.speed * dt;
        }

        this.timeSinceLastShot += dt;
        if (this.keys['Space'] && this.timeSinceLastShot >= this.fireRate) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 3,
                y: this.player.y,
                width: 6,
                height: 12,
                color: '#f3e7f2'
            });
            this.timeSinceLastShot = 0;
        }

        this.stars.forEach(star => {
            star.y += star.speed * dt;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.y -= this.bulletSpeed * dt;
            if (b.y + b.height < 0) {
                this.bullets.splice(i, 1);
            }
        }

        this.enemySpawnTimer += dt;
        let currentSpawnRate = this.baseEnemySpawnRate / Math.sqrt(this.difficultyMultiplier);

        if (this.enemySpawnTimer >= currentSpawnRate) {
            let size = Math.random() * 20 + 20;
            this.enemies.push({
                x: Math.random() * (this.canvas.width - size),
                y: -size,
                width: size,
                height: size,
                speed: (Math.random() * 50 + 100) * this.difficultyMultiplier,
                hp: size > 35 ? 2 : 1
            });
            this.enemySpawnTimer = 0;
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            enemy.y += enemy.speed * dt;

            if (enemy.y > this.canvas.height) {
                this.enemies.splice(i, 1);
                continue;
            }

            if (this.checkCollision(this.player, enemy)) {
                this.endGame();
                if (this.onGameOver) this.onGameOver(this.score);
                return;
            }

            for (let j = this.bullets.length - 1; j >= 0; j--) {
                let bullet = this.bullets[j];
                if (this.checkCollision(bullet, enemy)) {
                    this.bullets.splice(j, 1);

                    enemy.hp--;
                    if (enemy.hp <= 0) {
                        this.enemies.splice(i, 1);
                        this.score += 10;
                    } else {
                        enemy.width *= 0.8;
                        enemy.height *= 0.8;
                        enemy.x += (enemy.width * 0.2) / 2;
                    }
                    break;
                }
            }
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
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#663399';
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.size / 3;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        this.ctx.globalAlpha = 1.0;

        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x + this.player.width / 2, this.player.y + this.player.height - 5);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();

        this.bullets.forEach(b => {
            this.ctx.fillStyle = b.color;
            this.ctx.fillRect(b.x, b.y, b.width, b.height);
        });

        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = '#be6672';

            if (enemy.hp > 1) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Montserrat, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Счет: ${this.score}`, 10, 10);
    }
}