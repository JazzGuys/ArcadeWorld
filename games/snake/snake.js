const canvas = document.getElementById('game-canvas');

class Snake {
    constructor() {


        document.addEventListener('keydown', (event) => {
            event.preventDefault();

            const keyName = event.key;

            if (keyName === 'w') {
                console.log('up');
            }
            if (keyName === 's') {
                console.log('down');
            }
            if (keyName === 'a') {
                console.log('left');
            }
            if (keyName === 'd') {
                console.log('right');
            }
        });
    }
}