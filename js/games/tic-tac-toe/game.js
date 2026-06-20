export default class TicTacToe {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.board = Array(9).fill(null);
        this.playerMoves = [];
        this.aiMoves = [];

        this.isGameOver = false;
        this.score = 0;
        this.streak = 1;
        this.playerTurn = true;
        this.roundActive = true;
        this.roundStartTime = 0;
        this.statusText = "";
        this.aiMistakeChance = 0.45;

        this.cellSize = this.canvas.width / 3;

        this.handleCanvasClick = this.handleCanvasClick.bind(this);
    }

    init() {
        this.board = Array(9).fill(null);
        this.playerMoves = [];
        this.aiMoves = [];
        this.isGameOver = false;
        this.score = 0;
        this.streak = 1;
        this.playerTurn = true;
        this.roundActive = true;
        this.roundStartTime = performance.now();
        this.statusText = "";
        this.aiMistakeChance = 0.45;
        this.draw();
    }

    startGame(onGameOverCallback) {
        this.onGameOver = onGameOverCallback;
        this.canvas.addEventListener('mousedown', this.handleCanvasClick);
        this.canvas.addEventListener('touchstart', this.handleCanvasClick);
        this.roundStartTime = performance.now();
        this.draw();
    }

    endGame() {
        this.isGameOver = true;
        this.canvas.removeEventListener('mousedown', this.handleCanvasClick);
        this.canvas.removeEventListener('touchstart', this.handleCanvasClick);
    }

    handleCanvasClick(e) {
        if (this.isGameOver || !this.playerTurn || !this.roundActive) return;

        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = (clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (clientY - rect.top) * (this.canvas.height / rect.height);

        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        const index = row * 3 + col;

        if (this.board[index] === null) {
            if (this.playerMoves.length === 3) {
                const oldest = this.playerMoves.shift();
                this.board[oldest] = null;
            }

            this.board[index] = 'X';
            this.playerMoves.push(index);
            this.playerTurn = false;
            this.draw();

            if (this.checkWin('X')) {
                this.handleRoundWin();
            } else {
                this.roundActive = false;
                setTimeout(() => this.aiMove(), 500);
            }
        }
    }

    aiMove() {
        if (this.isGameOver) return;

        let bestMove;
        const isMistake = Math.random() < this.aiMistakeChance;

        if (isMistake) {
            const emptyIndices = [];
            for (let i = 0; i < 9; i++) {
                if (this.board[i] === null) emptyIndices.push(i);
            }
            bestMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        } else {
            bestMove = this.findBestMove();
        }

        if (this.aiMoves.length === 3) {
            const oldest = this.aiMoves.shift();
            this.board[oldest] = null;
        }

        this.board[bestMove] = 'O';
        this.aiMoves.push(bestMove);

        if (this.checkWin('O')) {
            this.roundActive = false;
            this.playerTurn = false;
            this.statusText = "КОМПЬЮТЕР ВЫИГРАЛ!";
            this.draw();
            setTimeout(() => this.triggerGameOver(), 1500);
        } else {
            this.playerTurn = true;
            this.roundActive = true;
            this.draw();
        }
    }

    findBestMove() {
        let tempBoard = [...this.board];
        if (this.aiMoves.length === 3) tempBoard[this.aiMoves[0]] = null;

        for (let i = 0; i < 9; i++) {
            if (tempBoard[i] === null) {
                tempBoard[i] = 'O';
                if (this.checkWinState(tempBoard, 'O')) return i;
                tempBoard[i] = null;
            }
        }

        let tempBoardPlayer = [...this.board];
        if (this.playerMoves.length === 3) tempBoardPlayer[this.playerMoves[0]] = null;

        for (let i = 0; i < 9; i++) {
            if (tempBoardPlayer[i] === null) {
                tempBoardPlayer[i] = 'X';
                if (this.checkWinState(tempBoardPlayer, 'X')) return i;
                tempBoardPlayer[i] = null;
            }
        }

        if (this.board[4] === null) return 4;

        const emptyIndices = [];
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === null) emptyIndices.push(i);
        }
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    checkWin(player) {
        return this.checkWinState(this.board, player);
    }

    checkWinState(boardState, player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return winPatterns.some(pattern =>
            pattern.every(index => boardState[index] === player)
        );
    }

    handleRoundWin() {
        this.roundActive = false;
        this.playerTurn = false;

        const elapsedSeconds = (performance.now() - this.roundStartTime) / 1000;
        const speedBonus = Math.max(0, Math.floor(100 - elapsedSeconds * 5));
        const roundPoints = 100 * this.streak + speedBonus;

        this.score += roundPoints;
        this.streak += 1;

        this.aiMistakeChance = Math.max(0.05, 0.45 - (this.streak - 1) * 0.05);

        this.statusText = `ПОБЕДА! +${roundPoints} ОЧКОВ`;
        this.draw();

        setTimeout(() => {
            this.board = Array(9).fill(null);
            this.playerMoves = [];
            this.aiMoves = [];
            this.playerTurn = true;
            this.roundActive = true;
            this.statusText = "";
            this.roundStartTime = performance.now();
            this.draw();
        }, 1800);
    }

    triggerGameOver() {
        this.endGame();
        if (this.onGameOver) {
            this.onGameOver(this.score);
        }
    }

    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#f3e7f2';
        this.ctx.font = 'bold 14px Montserrat, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`СЕРИЯ: x${this.streak}`, 15, 25);

        this.ctx.textAlign = 'right';
        this.ctx.fillText(`ОЧКИ: ${this.score}`, this.canvas.width - 15, 25);

        const gridOffset = 40;
        const gridHeight = this.canvas.height - gridOffset;
        const startY = gridOffset;
        const currentCellSize = (this.canvas.height - gridOffset) / 3;

        this.ctx.strokeStyle = '#2f2d31';
        this.ctx.lineWidth = 4;

        for (let i = 1; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, startY);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, startY + i * currentCellSize);
            this.ctx.lineTo(this.canvas.width, startY + i * currentCellSize);
            this.ctx.stroke();
        }

        this.board.forEach((cell, index) => {
            if (!cell) return;

            const row = Math.floor(index / 3);
            const col = index % 3;
            const x = col * this.cellSize + this.cellSize / 2;
            const y = startY + row * currentCellSize + currentCellSize / 2;
            const offset = 25;

            this.ctx.save();

            if (cell === 'X') {
                if (this.playerMoves.length === 3 && this.playerMoves[0] === index) {
                    this.ctx.globalAlpha = 0.35;
                }
                this.ctx.strokeStyle = '#663399';
                this.ctx.lineWidth = 8;
                this.ctx.lineCap = 'round';

                this.ctx.beginPath();
                this.ctx.moveTo(x - offset, y - offset);
                this.ctx.lineTo(x + offset, y + offset);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(x + offset, y - offset);
                this.ctx.lineTo(x - offset, y + offset);
                this.ctx.stroke();
            } else if (cell === 'O') {
                if (this.aiMoves.length === 3 && this.aiMoves[0] === index) {
                    this.ctx.globalAlpha = 0.35;
                }
                this.ctx.strokeStyle = '#80bd88';
                this.ctx.lineWidth = 8;

                this.ctx.beginPath();
                this.ctx.arc(x, y, offset, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            this.ctx.restore();
        });

        if (this.statusText !== "") {
            this.ctx.fillStyle = 'rgba(17, 17, 17, 0.85)';
            this.ctx.fillRect(0, startY, this.canvas.width, gridHeight);

            this.ctx.fillStyle = '#f3e7f2';
            this.ctx.font = 'bold 20px Montserrat, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.statusText, this.canvas.width / 2, startY + gridHeight / 2);
        }
    }
}