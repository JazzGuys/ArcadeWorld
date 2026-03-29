const api = {
    async post(endpoint, data) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

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
    }
};