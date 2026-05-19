export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.state = 'idle';
        this.timeoutId = null;
        this.startTime = 0;

        this.handleInteraction = this.handleInteraction.bind(this);
    }

    init() {
        this.state = 'idle';
        this.score = 0;
        this.isGameOver = false;
        this.draw();
    }

    startGame(onGameOverCallback) {
        this.onGameOver = onGameOverCallback;
        this.state = 'waiting';

        this.canvas.addEventListener('mousedown', this.handleInteraction);
        this.canvas.addEventListener('touchstart', this.handleInteraction);

        this.draw();

        const delay = 2000 + Math.random() * 3000;

        this.timeoutId = setTimeout(() => {
            this.state = 'ready';
            this.startTime = performance.now();
            this.draw();
        }, delay);
    }

    endGame() {
        this.isGameOver = true;
        if (this.timeoutId) clearTimeout(this.timeoutId);

        this.canvas.removeEventListener('mousedown', this.handleInteraction);
        this.canvas.removeEventListener('touchstart', this.handleInteraction);
    }

    handleInteraction(e) {
        e.preventDefault();

        if (this.state === 'waiting') {
            this.state = 'idle';
            this.score = 0;

            clearTimeout(this.timeoutId);

            this.triggerGameOver();

        } else if (this.state === 'ready') {
            this.state = 'idle';

            const reactionTimeMs = performance.now() - this.startTime;

            this.score = Math.max(0, 1000 - Math.floor(reactionTimeMs));

            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        this.endGame();
        if (this.onGameOver) {
            this.onGameOver(this.score);
        }
    }

    draw() {
        if (this.state === 'idle') {
            this.ctx.fillStyle = '#111';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (this.state === 'waiting') {
            this.ctx.fillStyle = '#be6672';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawText("Жди зеленого...");
        } else if (this.state === 'ready') {
            this.ctx.fillStyle = '#80bd88';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawText("КЛИКАЙ!");
        }
    }

    drawText(text) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 28px Montserrat, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    }

    drawResult(text1, text2) {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Montserrat, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.fillText(text1, this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillStyle = '#80bd88';
        this.ctx.fillText(text2, this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
}