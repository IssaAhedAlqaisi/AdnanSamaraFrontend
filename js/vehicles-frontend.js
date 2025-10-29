// frontend/js/vehicles-frontend.js
// يعتمد على frontend/js/api.js لقاعدة الـ API

document.addEventListener("DOMContentLoaded", () => {
  loadVehicles();
  loadVehicleLogs();

  // إضافة مركبة
  const addForm = document.getElementById('addForm');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;

      const data = {
        number: (f.plate?.value || '').trim(),
        driver_name: (f.driver?.value || '').trim(),
        current_location: (f.location?.value || '').trim(),
        capacity: (f.capacity?.value || '').trim() || "",
        model: (f.model?.value || '').trim() || "",
        status: (f.status?.value || '').trim() || "active"
      };

      if (!data.number || !data.driver_name) return;

      try {
        await api.post('/vehicles', data);
        f.reset();
        // إغلاق المودال لو موجود
        document.querySelector('#addModal .btn-close')?.click();
        await loadVehicles();
      } catch (err) {
        console.error('Add vehicle error:', err);
      }
    });
  }

  // إضافة سجل عدّاد يومي
  const logForm = document.getElementById('vehicleLogForm');
  if (logForm) {
    logForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;

      const payload = {
        driver_name: (f.driverSelect?.value || '').trim(),
        vehicle_number: (f.vehicleNumber?.value || '').trim(),
        odometer_start: parseFloat(f.odometer_start?.value || '0'),
        odometer_end: parseFloat(f.odometer_end?.value || '0'),
      };

      try {
        await api.post('/vehicles/logs', payload);
        f.reset();
        document.querySelector('#addLogModal .btn-close')?.click();
        await loadVehicleLogs(); // تحديث الجدول فوراً
      } catch (err) {
        console.error('Add log error:', err);
      }
    });
  }
});

// ========= المركبات =========
async function loadVehicles() {
  const tb = document.getElementById('rows');
  if (!tb) return;

  // صف تحميل هادئ (بدل ما نرمي "فشل")
  tb.innerHTML = `<tr><td colspan="5" class="text-muted">جاري التحميل…</td></tr>`;

  try {
    const list = await api.get('/vehicles');
    if (!Array.isArray(list) || list.length === 0) {
      tb.innerHTML = `<tr><td colspan="5" class="text-muted">لا توجد مركبات بعد</td></tr>`;
      document.getElementById("vehicleCount") && (document.getElementById("vehicleCount").textContent = '0');
      return;
    }

    tb.innerHTML = list.map(v => `
      <tr>
        <td>${escapeHtml(v.number)}</td>
        <td>${escapeHtml(v.driver_name || '')}</td>
        <td>${escapeHtml(v.current_location || '-')}</td>
        <td>${escapeHtml(v.status || '')}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="delVehicle(${Number(v.id)})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    const cnt = document.getElementById("vehicleCount");
    if (cnt) cnt.textContent = String(list.length);
  } catch (err) {
    console.error('Load vehicles error:', err);
    tb.innerHTML = `<tr><td colspan="5" class="text-danger">⚠️ تعذّر تحميل المركبات</td></tr>`;
  }
}

async function delVehicle(id) {
  if (!confirm("هل أنت متأكد من حذف هذه المركبة؟")) return;
  try {
    await api.delete('/vehicles/' + id);
    await loadVehicles();
  } catch (err) {
    console.error('Delete vehicle error:', err);
  }
}

// ========= سجلات العدّاد اليومية =========
async function loadVehicleLogs() {
  const tbody = document.querySelector('#vehicleLogsTable tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="text-muted">جاري التحميل…</td></tr>`;

  try {
    const logs = await api.get('/vehicles/logs');
    if (!Array.isArray(logs) || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted">لا توجد سجلات بعد</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${escapeHtml(l.date)}</td>
        <td>${escapeHtml(l.driver_name || '')}</td>
        <td>${escapeHtml(l.vehicle_number || '')}</td>
        <td>${isFiniteNum(l.odometer_start)}</td>
        <td>${isFiniteNum(l.odometer_end)}</td>
        <td>${isFiniteNum(l.distance)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Load logs error:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger">⚠️ تعذّر تحميل السجلات</td></tr>`;
  }
}

// ========= أدوات مساعدة =========
function isFiniteNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// (اختياري) طباعة جدول معيّن بالصفحة
function printTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const win = window.open('', '_blank');
  win.document.write(`
    <html lang="ar" dir="rtl">
      <head><meta charset="utf-8"><title>طباعة الجدول</title>
      <style>
        body{font-family:sans-serif;padding:20px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px;text-align:center}
        thead{background:#e5eefc;font-weight:bold}
      </style></head>
      <body>${table.outerHTML}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}
