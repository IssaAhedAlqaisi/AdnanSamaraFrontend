// js/vehicles-frontend.js

document.addEventListener('DOMContentLoaded', () => {
  loadVehicles();
  loadVehicleLogs();
  setupForms();
});

function setupForms() {
  // نموذج إضافة مركبة
  const addForm = document.getElementById('addForm');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const data = {
        number: f.plate.value,
        driver_name: f.driver.value,
        current_location: f.location.value || 'غير محدد',
        capacity: f.capacity?.value || '',
        model: f.model?.value || '',
        status: f.status.value || 'active',
        notes: f.notes?.value || ''
      };
      try {
        await vehiclesAPI.create(data);
        f.reset();
        // إغلاق المودال إن وجد
        document.querySelector('#addModal .btn-close')?.click();
        await loadVehicles();
        await populateDriverSelect(); // لتجهيز select الخاص بالسجلات
      } catch (err) {
        console.warn('Add vehicle failed:', err.message);
        alert('تعذّر إضافة المركبة');
      }
    });
  }

  // نموذج إضافة سجل عدّاد
  const logForm = document.getElementById('vehicleLogForm');
  if (logForm) {
    logForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const data = {
        driver_name: f.driverSelect.value,
        vehicle_number: f.vehicleNumber.value,
        odometer_start: f.odometer_start.value || null,
        odometer_end: f.odometer_end.value || null
      };

      if (!data.driver_name || !data.vehicle_number) {
        // بدون Alerts مزعجة — بس تجاهل بهدوء
        console.warn('Skipping log insert: missing driver/vehicle');
        return;
      }

      try {
        await vehiclesAPI.createLog(data);
        f.reset();
        document.querySelector('#addLogModal .btn-close')?.click();
        await loadVehicleLogs();
      } catch (err) {
        console.warn('Add vehicle log failed:', err.message);
        alert('تعذّر حفظ السجل');
      }
    });
  }

  // نحضّر قائمة السائقين للمودال
  populateDriverSelect();
}

async function populateDriverSelect() {
  const select = document.getElementById('driverSelect');
  const vehicleNumberInput = document.getElementById('vehicleNumber');
  if (!select) return;

  try {
    const vehicles = await vehiclesAPI.getAll();
    if (!vehicles.length) {
      select.innerHTML = '<option value="">لا توجد مركبات</option>';
      if (vehicleNumberInput) vehicleNumberInput.value = '';
      return;
    }
    select.innerHTML = vehicles.map(v =>
      `<option value="${escapeHtml(v.driver_name || '')}" data-number="${escapeHtml(v.number || '')}">
         ${escapeHtml(v.driver_name || '')}
       </option>`
    ).join('');

    // أول مركبة افتراضيًا
    const first = vehicles[0];
    if (vehicleNumberInput && first) vehicleNumberInput.value = first.number || '';

    select.onchange = (e) => {
      const opt = e.target.selectedOptions[0];
      if (vehicleNumberInput) vehicleNumberInput.value = opt?.dataset?.number || '';
    };
  } catch (err) {
    console.warn('populateDriverSelect failed:', err.message);
    select.innerHTML = '<option value="">لا توجد بيانات</option>';
    if (vehicleNumberInput) vehicleNumberInput.value = '';
  }
}

async function loadVehicles() {
  const tbody = document.getElementById('rows'); // جدول المركبات العلوي
  const countBadge = document.getElementById('vehicleCount'); // عدّاد المركبات
  if (!tbody) return;

  // Placeholder لطيف
  tbody.innerHTML = `<tr><td colspan="5" class="text-muted">جارٍ التحميل...</td></tr>`;

  try {
    const list = await vehiclesAPI.getAll();
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted">لا توجد مركبات بعد</td></tr>`;
      if (countBadge) countBadge.textContent = '0';
      return;
    }

    tbody.innerHTML = list.map(v => `
      <tr>
        <td>
          <button class="btn btn-sm btn-danger" onclick="delVehicle(${v.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
        <td>${escapeHtml(v.status || 'نشطة')}</td>
        <td>${escapeHtml(v.current_location || 'غير محدد')}</td>
        <td>${escapeHtml(v.driver_name || '')}</td>
        <td>${escapeHtml(v.number || '')}</td>
      </tr>
    `).join('');

    if (countBadge) countBadge.textContent = String(list.length);
  } catch (err) {
    console.warn('loadVehicles failed:', err.message);
    tbody.innerHTML = `<tr><td colspan="5" class="text-muted">لا توجد مركبات بعد</td></tr>`;
    if (countBadge) countBadge.textContent = '0';
  }
}

async function delVehicle(id) {
  if (!confirm('هل أنت متأكد من حذف هذه المركبة؟')) return;
  try {
    await vehiclesAPI.delete(id);
    await loadVehicles();
    await populateDriverSelect();
  } catch (err) {
    console.warn('Delete vehicle failed:', err.message);
    alert('تعذّر حذف المركبة');
  }
}

async function loadVehicleLogs() {
  const tbody = document.querySelector('#vehicleLogsTable tbody');
  if (!tbody) return;

  // Placeholder
  tbody.innerHTML = `<tr><td colspan="6" class="text-muted">جارٍ التحميل...</td></tr>`;

  try {
    const logs = await vehiclesAPI.getLogs();
    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted">لا توجد سجلات بعد</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${escapeHtml(String(l.date || ''))}</td>
        <td>${escapeHtml(l.driver_name || '')}</td>
        <td>${escapeHtml(l.vehicle_number || '')}</td>
        <td>${escapeHtml(l.odometer_start ?? '')}</td>
        <td>${escapeHtml(l.odometer_end ?? '')}</td>
        <td>${escapeHtml((l.distance ?? '').toString())}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.warn('loadVehicleLogs failed:', err.message);
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted">لا توجد سجلات بعد</td></tr>`;
  }
}

// Helper صغير لتفادي مشاكل HTML injection
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
