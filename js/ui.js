import api from './api.js';

// import Snake from "./games/snake/snake.js";
// const snake = new Snake();

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

const leadersTable = document.getElementById('leaders');

let isLoginMode = true;

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
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        userPanel.classList.add('hidden');
        usernameInput.value = '';
        passwordInput.value = '';
        authError.textContent = '';
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
        if (isLoginMode) {
            await login(username, password);
        } else {
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

function populateLeaderboard(leaders) {
    // api.getLeaders("snake").then((data) => console.log(data));
    leadersTable.innerHTML = '';
    if (leaders.length === 0) {
        leadersTable.innerHTML = '<tr><td>Лидеров нет</td></tr>';
        return;
    }
    leaders.forEach((leader, i) => {
        leadersTable.innerHTML += `<tr><td>${i + 1}</td><td>${leader.name}</td><td>${leader.score}</td></tr>`;
    })
}

populateLeaderboard([{name: "sas", score: 676767}, {name: "leven", score: 6767}, {name: "linik", score: 67}]);