document.addEventListener("DOMContentLoaded", () => {
  loadVehicles();
  populateDrivers();
  loadVehicleLogs();

  document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const data = {
      number: f.plate.value,
      driver_name: f.driver.value,
      current_location: f.location.value,
      capacity: "",
      model: "",
      status: f.status.value,
      notes: ""
    };
    await Api.post('/api/vehicles', data);
    f.reset();
    document.querySelector('#addModal .btn-close').click();
    loadVehicles();
  });

  document.getElementById('vehicleLogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const data = {
      driver_name: f.driverSelect.value,
      vehicle_number: f.vehicleNumber.value,
      odometer_start: f.odometer_start.value,
      odometer_end: f.odometer_end.value
    };
    await Api.post('/api/vehicles/logs', data);
    f.reset();
    document.querySelector('#addLogModal .btn-close').click();
    loadVehicleLogs();
  });
});

async function loadVehicles() {
  const tb = document.getElementById('rows');
  try {
    const list = await Api.get('/api/vehicles');
    tb.innerHTML = list.map(v => `
      <tr>
        <td>${v.number}</td>
        <td>${v.driver_name}</td>
        <td>${v.current_location || ''}</td>
        <td>${v.status}</td>
        <td><button class="btn btn-sm btn-danger" onclick="delVehicle(${v.id})"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `).join('');
    document.getElementById("vehicleCount").textContent = list.length;
  } catch {
    tb.innerHTML = `<tr><td colspan="5" class="text-danger">⚠️ فشل تحميل البيانات</td></tr>`;
  }
}

async function delVehicle(id) {
  if (!confirm("هل أنت متأكد من حذف هذه المركبة؟")) return;
  await Api.del('/api/vehicles/' + id);
  loadVehicles();
}

async function loadVehicleLogs() {
  const tbody = document.querySelector('#vehicleLogsTable tbody');
  try {
    const logs = await Api.get('/api/vehicles/logs');
    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted">لا توجد سجلات</td></tr>`;
      return;
    }
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${l.date}</td>
        <td>${l.driver_name}</td>
        <td>${l.vehicle_number}</td>
        <td>${l.odometer_start || 0}</td>
        <td>${l.odometer_end || 0}</td>
        <td>${(l.distance || 0).toFixed(2)}</td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger">⚠️ خطأ بالتحميل</td></tr>`;
  }
}

async function populateDrivers() {
  const select = document.getElementById('driverSelect');
  const vehicles = await Api.get('/api/vehicles');
  select.innerHTML = vehicles.map(v => `
    <option value="${v.driver_name}" data-number="${v.number}">${v.driver_name}</option>
  `).join('');
  select.addEventListener('change', e => {
    const opt = e.target.selectedOptions[0];
    document.getElementById('vehicleNumber').value = opt.dataset.number || '';
  });
  if (vehicles.length) {
    select.value = vehicles[0].driver_name;
    document.getElementById('vehicleNumber').value = vehicles[0].number;
  }
}
