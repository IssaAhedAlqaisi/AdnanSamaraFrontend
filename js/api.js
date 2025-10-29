// 🌐 قاعدة URL للخلفية - Render (انتبه لوجود -1)
const API_BASE_URL = 'https://adnansamarabackend-1.onrender.com/api';

/* ─────────────────────────────
   ⚙️ طلب موحّد مع Timeout + no-store
   ───────────────────────────── */
async function request(method, endpoint, data) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s

  const opts = {
    method,
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal: controller.signal,
  };
  if (data !== undefined) opts.body = JSON.stringify(data);

  let res, body = null;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, opts);
    try { body = await res.json(); } catch { body = null; }
  } catch (e) {
    clearTimeout(timeout);
    // انقطاع نت/Timeout
    const msg = e.name === 'AbortError' ? 'انتهى وقت الانتظار للاتصال (Timeout)' : 'تعذّر الاتصال بالخادم';
    throw new Error(msg);
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

/* ─────────────────────────────
   📡 طبقة طلبات عامة (GET/POST/PUT/DELETE)
   ───────────────────────────── */
const api = {
  get:    (endpoint)         => request('GET',    endpoint),
  post:   (endpoint, data)   => request('POST',   endpoint, data),
  put:    (endpoint, data)   => request('PUT',    endpoint, data),
  delete: (endpoint)         => request('DELETE', endpoint),
};

/* ─────────────────────────────
   👥 العملاء
   ───────────────────────────── */
const clientsAPI = {
  getAll:   ()         => api.get('/clients'),
  getById:  (id)       => api.get(`/clients/${id}`),
  create:   (data)     => api.post('/clients', data),
  update:   (id, data) => api.put(`/clients/${id}`, data),
  delete:   (id)       => api.delete(`/clients/${id}`),
  getStats: ()         => api.get('/clients/stats/summary')
};

/* ─────────────────────────────
   👨‍🔧 الموظفون
   ───────────────────────────── */
const employeesAPI = {
  getAll:   ()         => api.get('/employees'),
  create:   (data)     => api.post('/employees', data),
  update:   (id, data) => api.put(`/employees/${id}`, data),
  delete:   (id)       => api.delete(`/employees/${id}`),
  getStats: ()         => api.get('/employees/stats/summary')
};

/* ─────────────────────────────
   💰 الإيرادات
   ───────────────────────────── */
const revenueAPI = {
  getAll:   ()         => api.get('/revenue'),
  create:   (data)     => api.post('/revenue', data),
  update:   (id, data) => api.put(`/revenue/${id}`, data),
  delete:   (id)       => api.delete(`/revenue/${id}`),
  getStats: (period='month') => api.get(`/revenue/stats/summary?period=${encodeURIComponent(period)}`)
};

/* ─────────────────────────────
   🚚 الموردون
   ───────────────────────────── */
const suppliersAPI = {
  getAll:   ()         => api.get('/suppliers'),
  create:   (data)     => api.post('/suppliers', data),
  update:   (id, data) => api.put(`/suppliers/${id}`, data),
  delete:   (id)       => api.delete(`/suppliers/${id}`)
};

/* ─────────────────────────────
   🚛 المركبات
   ───────────────────────────── */
const vehiclesAPI = {
  getAll:    ()         => api.get('/vehicles'),
  create:    (data)     => api.post('/vehicles', data),
  update:    (id, data) => api.put(`/vehicles/${id}`, data),
  delete:    (id)       => api.delete(`/vehicles/${id}`),

  // سجلات المركبات اليومية
  getLogs:   ()         => api.get('/vehicles/logs'),
  createLog: (data)     => api.post('/vehicles/logs', data),
  // إذا لزم لاحقًا تقدر تضيف update/delete للسجلات
};

/* ─────────────────────────────
   💸 المصاريف
   ───────────────────────────── */
const expensesAPI = {
  getAll:  ()         => api.get('/expenses'),
  create:  (data)     => api.post('/expenses', data),
  update:  (id, data) => api.put(`/expenses/${id}`, data),
  delete:  (id)       => api.delete(`/expenses/${id}`)
};
