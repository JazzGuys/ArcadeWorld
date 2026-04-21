const SPEED_MULTIPLIER = 1;

export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;

        this.keyDownHandler = this.keyDownHandler.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);
    }

    init() {
        this.score = 0;
        this.isGameOver = false;
        this.lastTime = performance.now();

        this.baseSpeed = 250;
        this.paddleSpeed = 400;

        this.ballRadius = 6;
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height - 40;

        let startAngle = -Math.PI / 4;
        this.ballDx = Math.cos(startAngle) * this.baseSpeed;
        this.ballDy = Math.sin(startAngle) * this.baseSpeed;

        this.paddleHeight = 10;
        this.paddleWidth = 75;
        this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
        this.rightPressed = false;
        this.leftPressed = false;

        this.brickRowCount = 5;
        this.brickColumnCount = 7;
        this.brickWidth = 45;
        this.brickHeight = 15;
        this.brickPadding = 8;
        this.brickOffsetTop = 30;
        this.brickOffsetLeft = 18;

        this.generateBricks();
        this.draw();
    }

    generateBricks() {
        this.bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                this.bricks[c][r] = {x: 0, y: 0, status: 1};
            }
        }
    }

    startGame(onGameOverCallback) {
        this.onGameOver = onGameOverCallback;
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);

        this.lastTime = performance.now();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = window.requestAnimationFrame(this.gameLoop.bind(this));
    }

    endGame() {
        this.isGameOver = true;
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
    }

    keyDownHandler(e) {
        if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(e.code)) e.preventDefault();
        if (e.code === "ArrowRight" || e.code === "KeyD") this.rightPressed = true;
        else if (e.code === "ArrowLeft" || e.code === "KeyA") this.leftPressed = true;
    }

    keyUpHandler(e) {
        if (e.code === "ArrowRight" || e.code === "KeyD") this.rightPressed = false;
        else if (e.code === "ArrowLeft" || e.code === "KeyA") this.leftPressed = false;
    }

    collisionDetection() {
        let activeBricks = 0;

        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                let b = this.bricks[c][r];
                if (b.status === 1) {
                    activeBricks++;

                    let testX = this.ballX;
                    let testY = this.ballY;

                    if (this.ballX < b.x) testX = b.x;
                    else if (this.ballX > b.x + this.brickWidth) testX = b.x + this.brickWidth;

                    if (this.ballY < b.y) testY = b.y;
                    else if (this.ballY > b.y + this.brickHeight) testY = b.y + this.brickHeight;

                    let distX = this.ballX - testX;
                    let distY = this.ballY - testY;
                    let distance = Math.sqrt((distX * distX) + (distY * distY));

                    if (distance <= this.ballRadius) {
                        b.status = 0;
                        this.score += 10;

                        if (Math.abs(distX) > Math.abs(distY)) {
                            this.ballDx = -this.ballDx;
                        } else {
                            this.ballDy = -this.ballDy;
                        }

                        this.ballDx *= SPEED_MULTIPLIER;
                        this.ballDy *= SPEED_MULTIPLIER;
                    }
                }
            }
        }

        if (activeBricks === 0) {
            this.generateBricks();
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
        this.collisionDetection();

        if (this.rightPressed && this.paddleX < this.canvas.width - this.paddleWidth) {
            this.paddleX += this.paddleSpeed * dt;
        } else if (this.leftPressed && this.paddleX > 0) {
            this.paddleX -= this.paddleSpeed * dt;
        }

        this.ballX += this.ballDx * dt;
        this.ballY += this.ballDy * dt;

        if (this.ballX + this.ballRadius > this.canvas.width) {
            this.ballX = this.canvas.width - this.ballRadius;
            this.ballDx = -this.ballDx;
        } else if (this.ballX - this.ballRadius < 0) {
            this.ballX = this.ballRadius;
            this.ballDx = -this.ballDx;
        }

        if (this.ballY - this.ballRadius < 0) {
            this.ballY = this.ballRadius;
            this.ballDy = -this.ballDy;
        }

        let paddleTop = this.canvas.height - this.paddleHeight;

        if (this.ballDy > 0 &&
            this.ballY + this.ballRadius >= paddleTop &&
            this.ballY - this.ballRadius <= this.canvas.height &&
            this.ballX >= this.paddleX &&
            this.ballX <= this.paddleX + this.paddleWidth) {

            this.ballY = paddleTop - this.ballRadius;

            let hitPoint = this.ballX - (this.paddleX + this.paddleWidth / 2);
            let normalizedHit = hitPoint / (this.paddleWidth / 2);

            let currentSpeed = Math.sqrt(this.ballDx * this.ballDx + this.ballDy * this.ballDy);

            let maxBounceAngle = Math.PI / 3;
            let bounceAngle = normalizedHit * maxBounceAngle;

            this.ballDx = currentSpeed * Math.sin(bounceAngle);
            this.ballDy = -currentSpeed * Math.cos(bounceAngle);
        }

        if (this.ballY + this.ballRadius > this.canvas.height) {
            this.endGame();
            if (this.onGameOver) this.onGameOver(this.score);
        }
    }

    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    let brickX = (c * (this.brickWidth + this.brickPadding)) + this.brickOffsetLeft;
                    let brickY = (r * (this.brickHeight + this.brickPadding)) + this.brickOffsetTop;
                    this.bricks[c][r].x = brickX;
                    this.bricks[c][r].y = brickY;

                    this.ctx.fillStyle = '#663399';
                    this.ctx.fillRect(brickX, brickY, this.brickWidth, this.brickHeight);
                }
            }
        }

        this.ctx.fillStyle = '#80bd88';
        this.ctx.fillRect(this.paddleX, this.canvas.height - this.paddleHeight, this.paddleWidth, this.paddleHeight);

        this.ctx.beginPath();
        this.ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#be6672';
        this.ctx.fill();
        this.ctx.closePath();
    }
}