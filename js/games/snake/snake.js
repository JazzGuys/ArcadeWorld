const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 20;

let lastTime = 0;
const speed = 10;

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Snake {
    constructor() {
        this.body = [new Vector2(5, 5)];
        this.direction = new Vector2(1, 0);
        this.food = new Vector2(6, 7);
        this.score = 0;

        window.requestAnimationFrame(this.gameLoop.bind(this));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'w' && this.direction.y === 0) { this.direction = new Vector2(0, -1); }
            else if (e.key === 's' && this.direction.y === 0) { this.direction = new Vector2(0, 1); }
            else if (e.key === 'a' && this.direction.x === 0) { this.direction = new Vector2(-1, 0); }
            else if (e.key === 'd' && this.direction.x === 0) { this.direction = new Vector2(1, 0); }
        });
    }

    gameLoop(currentTime) {
        window.requestAnimationFrame(this.gameLoop.bind(this));

        const secondsSinceLastRender = (currentTime - lastTime) / 1000;

        if (secondsSinceLastRender < 1 / speed) return;

        lastTime = currentTime;

        this.update();
        this.draw();
    }

    update() {
        const head = this.body[0];
        const newHead = new Vector2(head.x + this.direction.x, head.y + this.direction.y);

        this.body.unshift(newHead);

        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.spawnFood();
        } else {
            this.body.pop();
        }
    }

    spawnFood() {
        this.food = new Vector2(
            Math.floor(Math.random() * (canvas.width / CELL_SIZE)),
            Math.floor(Math.random() * (canvas.height / CELL_SIZE))
        );
    }

    draw() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'lime';
        this.body.forEach(segment => {
            ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE - 2, CELL_SIZE - 2);
        });

        ctx.fillStyle = 'red';
        ctx.fillRect(this.food.x * CELL_SIZE, this.food.y * CELL_SIZE, CELL_SIZE - 2, CELL_SIZE - 2);

        // const grid_size = {x: canvas.width / CELL_SIZE, y: canvas.height / CELL_SIZE};
        // for (let x = 0; x < grid_size.x; x++) {
        //     for (let y = 0; y < grid_size.y; y++) {
        //         ctx.fillStyle = `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`;
        //         ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE + CELL_SIZE);
        //     }
        // }
    }
}

export default Snake;