// 🌐 قاعدة URL للخلفية - جاهزة للإصدار على Render
const API_BASE_URL = 'https://adnansamarabackend.onrender.com/api';

// 📡 دوال عامة للاتصال بالخلفية
const api = {
    // دالة GET عامة
    async get(endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('GET Error:', error);
            throw error;
        }
    },

    // دالة POST عامة
    async post(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('POST Error:', error);
            throw error;
        }
    },

    // دالة PUT عامة
    async put(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('PUT Error:', error);
            throw error;
        }
    },

    // دالة DELETE عامة
    async delete(endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('DELETE Error:', error);
            throw error;
        }
    }
};

// 👥 دوال خاصة بالعملاء
const clientsAPI = {
    async getAll() {
        return await api.get('/clients');
    },

    async getById(id) {
        return await api.get(`/clients/${id}`);
    },

    async create(clientData) {
        return await api.post('/clients', clientData);
    },

    async update(id, clientData) {
        return await api.put(`/clients/${id}`, clientData);
    },

    async delete(id) {
        return await api.delete(`/clients/${id}`);
    },

    async getStats() {
        return await api.get('/clients/stats/summary');
    }
};

// 👨‍🔧 دوال خاصة بالموظفين
const employeesAPI = {
    async getAll() {
        return await api.get('/employees');
    },

    async create(employeeData) {
        return await api.post('/employees', employeeData);
    },

    async update(id, employeeData) {
        return await api.put(`/employees/${id}`, employeeData);
    },

    async delete(id) {
        return await api.delete(`/employees/${id}`);
    },

    async getStats() {
        return await api.get('/employees/stats/summary');
    }
};

// 💰 دوال خاصة بالإيرادات
const revenueAPI = {
    async getAll() {
        return await api.get('/revenue');
    },

    async create(revenueData) {
        return await api.post('/revenue', revenueData);
    },

    async update(id, revenueData) {
        return await api.put(`/revenue/${id}`, revenueData);
    },

    async delete(id) {
        return await api.delete(`/revenue/${id}`);
    },

    async getStats(period = 'month') {
        return await api.get(`/revenue/stats/summary?period=${period}`);
    }
};

// 🚚 دوال خاصة بالموردين
const suppliersAPI = {
    async getAll() {
        return await api.get('/suppliers');
    },

    async create(supplierData) {
        return await api.post('/suppliers', supplierData);
    }
};

// 🚛 دوال خاصة بالمركبات
const vehiclesAPI = {
    async getAll() {
        return await api.get('/vehicles');
    },

    async create(vehicleData) {
        return await api.post('/vehicles', vehicleData);
    }
};

// 💸 دوال خاصة بالمصاريف
const expensesAPI = {
    async getAll() {
        return await api.get('/expenses');
    },

    async create(expenseData) {
        return await api.post('/expenses', expenseData);
    },

    async delete(id) {
        return await api.delete(`/expenses/${id}`);
    }
};
