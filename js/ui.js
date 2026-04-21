import api from './api.js';

const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const userPanel = document.getElementById('user-panel');
const welcomeMessage = document.getElementById('welcome-message');

const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const toggleAuthLink = document.getElementById('toggle-auth-link');
const toggleAuthMsg = document.getElementById('toggle-auth-msg');
const logoutBtn = document.getElementById('logout-btn');

const gameSelection = document.getElementById('game-selection');
const gamesGrid = document.getElementById('games-grid');
const gameContainer = document.getElementById('game-container');
const backToGamesBtn = document.getElementById('back-to-games-btn');
const currentGameTitle = document.getElementById('current-game-title');
const leadersTable = document.getElementById('leaders');

const gameOverlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayActionBtn = document.getElementById('overlay-action-btn');

let isLoginMode = true;
let currentGameInstance = null;
let currentGameId = null;

async function login(username, password) {
    const data = await api.login(username, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    checkAuth();
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        userPanel.classList.remove('hidden');
        welcomeMessage.textContent = `Привет, ${username}!`;
        showGameSelection();
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        userPanel.classList.add('hidden');
        usernameInput.value = '';
        passwordInput.value = '';
        authError.textContent = '';
        if (currentGameInstance) currentGameInstance.endGame();
    }
}

toggleAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    authError.textContent = '';
    if (isLoginMode) {
        authTitle.textContent = 'Вход';
        authSubmitBtn.textContent = 'Войти';
        toggleAuthMsg.textContent = 'Нет аккаунта?';
        toggleAuthLink.textContent = 'Зарегистрироваться';
    } else {
        authTitle.textContent = 'Регистрация';
        authSubmitBtn.textContent = 'Создать аккаунт';
        toggleAuthMsg.textContent = 'Уже есть аккаунт?';
        toggleAuthLink.textContent = 'Войти';
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!username || !password) {
        authError.textContent = 'Заполните все поля';
        return;
    }
    authSubmitBtn.disabled = true;
    authError.textContent = '';
    try {
        if (isLoginMode) await login(username, password);
        else {
            await api.register(username, password);
            await login(username, password);
        }
    } catch (error) {
        authError.textContent = error.message;
    } finally {
        authSubmitBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    checkAuth();
});

checkAuth();

async function updateLeaderboard(gameId) {
    leadersTable.innerHTML = '<tr><td colspan="3">Загрузка...</td></tr>';
    try {
        const leaders = await api.getLeaders(gameId);
        leadersTable.innerHTML = '';
        if (!leaders || leaders.length === 0) {
            leadersTable.innerHTML = '<tr><td colspan="3" style="text-align: center">Лидеров нет</td></tr>';
            return;
        }
        leaders.forEach((leader, i) => {
            leadersTable.innerHTML += `<tr><td>${i + 1}</td><td>${leader.username || leader.name}</td><td>${leader.score}</td></tr>`;
        });
    } catch (e) {
        leadersTable.innerHTML = '<tr><td colspan="3">Ошибка загрузки</td></tr>';
    }
}

function showGameSelection() {
    gameSelection.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    if (currentGameInstance) {
        currentGameInstance.endGame();
        currentGameInstance = null;
    }
}

backToGamesBtn.addEventListener('click', showGameSelection);

async function populateGameList() {
    try {
        const response = await fetch("./js/games.json");
        const gameNames = await response.json();
        gamesGrid.innerHTML = '';

        for (const name of gameNames) {
            const configRequest = await fetch(`./js/games/${name}/config.json`);
            const config = await configRequest.json();
            const card = document.createElement('div');
            card.className = 'game-card';
            card.dataset.gameid = name;
            card.innerHTML = `<h3>${config.name}</h3><p>${config.description}</p>`;
            gamesGrid.appendChild(card);
        }
    } catch (e) {
        console.error("Ошибка", e);
    }
}

gamesGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.game-card');
    if (!card) return;

    currentGameId = card.dataset.gameid;
    const gameTitle = card.querySelector('h3').textContent;

    gameSelection.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    currentGameTitle.textContent = gameTitle;

    await updateLeaderboard(currentGameId);

    try {
        const module = await import(`./games/${currentGameId}/game.js`);
        const GameClass = module.default;

        currentGameInstance = new GameClass('game-canvas');
        currentGameInstance.init();

        gameOverlay.classList.remove('hidden');
        overlayTitle.textContent = gameTitle;
        overlayActionBtn.textContent = "Начать игру";

        overlayActionBtn.onclick = () => {
            overlayActionBtn.blur();
            gameOverlay.classList.add('hidden');
            currentGameInstance.startGame(handleGameOver);
        };
    } catch (err) {
        console.error("Ошибка загрузки:", err);
        showGameSelection();
    }
});

async function handleGameOver(score) {
    gameOverlay.classList.remove('hidden');
    overlayTitle.textContent = "Игра окончена";
    overlayText.textContent = `Твой счет: ${score}`;
    overlayActionBtn.textContent = "Сыграть еще раз";

    try {
        await api.submitScore(currentGameId, score);
        await updateLeaderboard(currentGameId);
    } catch (e) {
        console.error('Ошибка сохранения', e);
    }

    overlayActionBtn.onclick = () => {
        overlayActionBtn.blur();
        gameOverlay.classList.add('hidden');
        currentGameInstance.init();
        currentGameInstance.startGame(handleGameOver);
    };
}

await populateGameList();