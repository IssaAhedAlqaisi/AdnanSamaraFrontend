// frontend/js/api.js
// 🌐 قاعدة URL للخلفية - Render (انتبه لوجود -1)
const API_BASE_URL = 'https://adnansamarabackend-1.onrender.com/api';

/* ─────────────────────────────
   📡 طبقة طلبات عامة (GET/POST/PUT/DELETE)
   ───────────────────────────── */
const api = {
  async get(endpoint) {
    const r = await fetch(`${API_BASE_URL}${endpoint}`);
    return handle(r);
  },
  async post(endpoint, data) {
    const r = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handle(r);
  },
  async put(endpoint, data) {
    const r = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handle(r);
  },
  async delete(endpoint) {
    const r = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE' });
    return handle(r);
  }
};

// 🧰 هيلبر موحّد للتعامل مع الاستجابات
async function handle(res) {
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

/* ─────────────────────────────
   👥 العملاء
   ───────────────────────────── */
const clientsAPI = {
  getAll:   () => api.get('/clients'),
  getById:  (id) => api.get(`/clients/${id}`),
  create:   (data) => api.post('/clients', data),
  update:   (id, data) => api.put(`/clients/${id}`, data),
  delete:   (id) => api.delete(`/clients/${id}`),
  getStats: () => api.get('/clients/stats/summary')
};

/* ─────────────────────────────
   👨‍🔧 الموظفون
   ───────────────────────────── */
const employeesAPI = {
  getAll:   () => api.get('/employees'),
  create:   (data) => api.post('/employees', data),
  update:   (id, data) => api.put(`/employees/${id}`, data),
  delete:   (id) => api.delete(`/employees/${id}`),
  getStats: () => api.get('/employees/stats/summary')
};

/* ─────────────────────────────
   💰 الإيرادات
   ───────────────────────────── */
const revenueAPI = {
  getAll:   () => api.get('/revenue'),
  create:   (data) => api.post('/revenue', data),
  update:   (id, data) => api.put(`/revenue/${id}`, data),
  delete:   (id) => api.delete(`/revenue/${id}`),
  getStats: (period = 'month') => api.get(`/revenue/stats/summary?period=${period}`)
};

/* ─────────────────────────────
   🚚 الموردون
   ───────────────────────────── */
const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`)
};

/* ─────────────────────────────
   🚛 المركبات
   ───────────────────────────── */
const vehiclesAPI = {
  getAll:    () => api.get('/vehicles'),
  create:    (data) => api.post('/vehicles', data),
  update:    (id, data) => api.put(`/vehicles/${id}`, data),
  delete:    (id) => api.delete(`/vehicles/${id}`),
  getLogs:   () => api.get('/vehicles/logs'),
  createLog: (data) => api.post('/vehicles/logs', data),
};

/* ─────────────────────────────
   💸 المصاريف + أنواع المصاريف
   ───────────────────────────── */
const expensesAPI = {
  // المصاريف
  getAll:  () => api.get('/expenses'),
  create:  (data) => api.post('/expenses', data),
  update:  (id, data) => api.put(`/expenses/${id}`, data),
  delete:  (id) => api.delete(`/expenses/${id}`),

  // أنواع المصاريف
  getTypes:   () => api.get('/expenses/types'),
  createType: (data) => api.post('/expenses/types', data),   // { name }
  deleteType: (id) => api.delete(`/expenses/types/${id}`)
};
