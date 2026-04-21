const api = {
    _getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        const response = await fetch(url, {
            method: 'GET',
            headers: this._getHeaders()
        });

        return this._handleResponse(response);
    },

    async post(endpoint, data) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify(data)
        });

        return this._handleResponse(response);
    },

    async _handleResponse(response) {
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Произошла ошибка');
        }

        return result;
    },

    register(username, password) {
        return this.post('http://localhost:3000/api/register', {username, password});
    },

    login(username, password) {
        return this.post('http://localhost:3000/api/login', {username, password});
    },

    getLeaders(game) {
        return this.get('http://localhost:3000/api/leaderboard', {game});
    },

    submitScore(game, score) {
        return this.post('http://localhost:3000/api/score', {game, score});
    }
};

export default api;