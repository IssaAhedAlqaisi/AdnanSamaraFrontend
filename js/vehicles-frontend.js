// frontend/js/vehicles-frontend.js
// يفترض وجود api.{get,post,delete} من js/api.js و API_BASE_URL مضبوط

document.addEventListener("DOMContentLoaded", () => {
  loadVehicles();
  populateDrivers().then(() => loadVehicleLogs());

  // ➕ إضافة مركبة جديدة
  const addForm = document.getElementById('addForm');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const data = {
        number: f.plate.value.trim(),
        driver_name: f.driver.value.trim(),
        current_location: (f.location.value || "").trim(),
        capacity: "",
        model: "",
        status: f.status.value
      };
      if (!data.number || !data.driver_name) return;
      await api.post('/vehicles', data);
      f.reset();
      document.querySelector('#addModal .btn-close')?.click();
      await loadVehicles();
      await populateDrivers(); // حدّث قائمة السائقين بعد إضافة مركبة
    });
  }

  // 🧾 إضافة سجل يومي
  const logForm = document.getElementById('vehicleLogForm');
  if (logForm) {
    logForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;

      // تأكد دائماً من تعبئة الحقول (populateDrivers يضبط الافتراضيات)
      const data = {
        driver_name: (f.driverSelect.value || "").trim(),
        vehicle_number: (f.vehicleNumber.value || "").trim(),
        odometer_start: f.odometer_start.value,
        odometer_end: f.odometer_end.value
      };

      await api.post('/vehicles/logs', data);
      f.reset();
      await populateDrivers(); // رجّع الافتراضيات بعد reset
      document.querySelector('#addLogModal .btn-close')?.click();
      loadVehicleLogs();
    });
  }
});

// 🚚 تحميل المركبات
async function loadVehicles() {
  const tb = document.getElementById('rows');
  const counter = document.getElementById("vehicleCount");
  if (!tb) return;
  try {
    const list = await api.get('/vehicles');
    tb.innerHTML = list.length
      ? list.map(v => `
      <tr>
        <td>${v.number}</td>
        <td>${v.driver_name}</td>
        <td>${v.current_location || '-'}</td>
        <td>${v.status}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="delVehicle(${v.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('')
      : `<tr><td colspan="5" class="text-muted">لا توجد مركبات</td></tr>`;
    if (counter) counter.textContent = list.length;
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="5" class="text-danger">⚠️ فشل تحميل البيانات</td></tr>`;
  }
}

// 🗑️ حذف مركبة
async function delVehicle(id) {
  if (!confirm("هل أنت متأكد من حذف هذه المركبة؟")) return;
  await api.delete('/vehicles/' + id);
  await loadVehicles();
  await populateDrivers(); // حدّث القائمة بعد الحذف
}

// 📘 تحميل السجلات اليومية
async function loadVehicleLogs() {
  const tbody = document.querySelector('#vehicleLogsTable tbody');
  if (!tbody) return;
  try {
    const logs = await api.get('/vehicles/logs');
    tbody.innerHTML = logs.length
      ? logs.map(l => `
        <tr>
          <td>${l.date}</td>
          <td>${l.driver_name}</td>
          <td>${l.vehicle_number}</td>
          <td>${l.odometer_start ?? 0}</td>
          <td>${l.odometer_end ?? 0}</td>
          <td>${l.distance ?? 0}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="6" class="text-muted">لا توجد سجلات</td></tr>`;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger">⚠️ خطأ بالتحميل</td></tr>`;
  }
}

// 📋 تعبئة قائمة السائقين + ربط رقم المركبة
async function populateDrivers() {
  const select = document.getElementById('driverSelect');
  const vehicleNumberInput = document.getElementById('vehicleNumber');
  if (!select || !vehicleNumberInput) return;

  const vehicles = await api.get('/vehicles');

  if (!vehicles.length) {
    select.innerHTML = `<option value="">لا يوجد مركبات</option>`;
    vehicleNumberInput.value = "";
    return;
  }

  select.innerHTML = vehicles.map(v => `
    <option value="${v.driver_name}" data-number="${v.number}">
      ${v.driver_name} — ${v.number}
    </option>
  `).join('');

  // اختَر أول عنصر وافتح حقله
  const first = select.options[0];
  select.value = first.value;
  vehicleNumberInput.value = first.dataset.number || '';

  // غيّر الرقم تلقائيًا عند تغيير السائق
  select.addEventListener('change', e => {
    const opt = e.target.selectedOptions[0];
    vehicleNumberInput.value = opt?.dataset.number || '';
  });
}
