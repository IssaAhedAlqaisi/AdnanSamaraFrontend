document.addEventListener("DOMContentLoaded", () => {
  loadVehicles();
  populateDrivers();
  loadVehicleLogs();

  // إضافة مركبة
  const addForm = document.getElementById('addForm');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;

      // تأكد أن أسماء الحقول بالـ HTML: plate, driver, location, status
      const data = {
        number: (f.plate?.value || '').trim(),
        driver_name: (f.driver?.value || '').trim(),
        current_location: (f.location?.value || '').trim(),
        capacity: "",
        model: "",
        status: (f.status?.value || 'active'),
        notes: ""
      };

      if (!data.number || !data.driver_name) {
        alert("رقم اللوحة واسم السائق مطلوبان");
        return;
      }

      try {
        await Api.post('/api/vehicles', data);
        f.reset();

        // اغلاق المودال
        const closeBtn = document.querySelector('#addModal .btn-close');
        if (closeBtn) closeBtn.click();

        // تحديث الجداول والقوائم
        await loadVehicles();
        await populateDrivers();
      } catch (err) {
        console.error('Add vehicle error:', err);
        alert('فشل إضافة المركبة');
      }
    });
  }

  // إضافة سجل عداد مركبة
  const logForm = document.getElementById('vehicleLogForm');
  if (logForm) {
    logForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const data = {
        driver_name: (f.driverSelect?.value || '').trim(),
        vehicle_number: (f.vehicleNumber?.value || '').trim(),
        odometer_start: Number(f.odometer_start?.value || 0),
        odometer_end: Number(f.odometer_end?.value || 0)
      };

      if (!data.driver_name || !data.vehicle_number) {
        alert("اختر السائق والمركبة أولاً");
        return;
      }

      try {
        await Api.post('/api/vehicles/logs', data);
        f.reset();
        const closeBtn = document.querySelector('#addLogModal .btn-close');
        if (closeBtn) closeBtn.click();
        await loadVehicleLogs();
      } catch (err) {
        console.error('Add vehicle log error:', err);
        alert('فشل إضافة السجل');
      }
    });
  }
});

async function loadVehicles() {
  const tb = document.getElementById('rows');
  if (!tb) return;

  try {
    const list = await Api.get('/api/vehicles');
    if (!Array.isArray(list) || !list.length) {
      tb.innerHTML = `<tr><td colspan="5" class="text-muted">لا توجد مركبات</td></tr>`;
      document.getElementById("vehicleCount")?.textContent = '0';
      return;
    }

    tb.innerHTML = list.map(v => `
      <tr>
        <td>${escapeHtml(v.number || '')}</td>
        <td>${escapeHtml(v.driver_name || '')}</td>
        <td>${escapeHtml(v.current_location || '')}</td>
        <td>${escapeHtml(v.status || 'active')}</td>
        <td><button class="btn btn-sm btn-danger" onclick="delVehicle(${Number(v.id)})"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `).join('');
    const cntEl = document.getElementById("vehicleCount");
    if (cntEl) cntEl.textContent = String(list.length);
  } catch (err) {
    console.error('Load vehicles error:', err);
    tb.innerHTML = `<tr><td colspan="5" class="text-danger">⚠️ فشل تحميل البيانات</td></tr>`;
  }
}

async function delVehicle(id) {
  if (!confirm("هل أنت متأكد من حذف هذه المركبة؟")) return;
  try {
    await Api.del('/api/vehicles/' + id);
    await loadVehicles();
    await populateDrivers();
  } catch (err) {
    console.error('Delete vehicle error:', err);
    alert('فشل حذف المركبة');
  }
}

async function loadVehicleLogs() {
  const tbody = document.querySelector('#vehicleLogsTable tbody');
  if (!tbody) return;

  try {
    const logs = await Api.get('/api/vehicles/logs');
    if (!Array.isArray(logs) || !logs.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted">لا توجد سجلات</td></tr>`;
      return;
    }
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${escapeHtml(l.date || '')}</td>
        <td>${escapeHtml(l.driver_name || '')}</td>
        <td>${escapeHtml(l.vehicle_number || '')}</td>
        <td>${Number(l.odometer_start || 0)}</td>
        <td>${Number(l.odometer_end || 0)}</td>
        <td>${Number(l.distance || 0).toFixed(2)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Load vehicle logs error:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger">⚠️ خطأ بالتحميل</td></tr>`;
  }
}

async function populateDrivers() {
  const select = document.getElementById('driverSelect');
  if (!select) return;

  try {
    const vehicles = await Api.get('/api/vehicles');
    if (!Array.isArray(vehicles) || !vehicles.length) {
      select.innerHTML = `<option value="">لا توجد مركبات</option>`;
      const vn = document.getElementById('vehicleNumber');
      if (vn) vn.value = '';
      return;
    }

    select.innerHTML = vehicles.map(v => `
      <option value="${escapeHtml(v.driver_name || '')}" data-number="${escapeHtml(v.number || '')}">
        ${escapeHtml(v.driver_name || '')}
      </option>
    `).join('');

    // عند تغيير السائق، عبّي رقم المركبة تلقائي
    select.addEventListener('change', e => {
      const opt = e.target.selectedOptions[0];
      document.getElementById('vehicleNumber').value = opt?.dataset?.number || '';
    });

    // اختيار أول عنصر افتراضيًا
    select.value = vehicles[0].driver_name || '';
    const vn = document.getElementById('vehicleNumber');
    if (vn) vn.value = vehicles[0].number || '';
  } catch (err) {
    console.error('Populate drivers error:', err);
  }
}

// حماية بسيطة من إدخال HTML
function escapeHtml(v) {
  return (v ?? '').toString().replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[s]));
}
