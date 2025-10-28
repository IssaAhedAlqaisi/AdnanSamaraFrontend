
// ✅ تفعيل القائمة الجانبية (فتح/إغلاق)
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar-wrapper");
  const pageContent = document.getElementById("page-content-wrapper");
  const toggleBtn = document.getElementById("menu-toggle");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      pageContent.classList.toggle("expanded");
    });
  }
});

const API = "https://adnansamarabackend.onrender.com/api/revenue";

document.addEventListener("DOMContentLoaded", () => {
  // التاريخ التلقائي
  document.getElementById("date").value = new Date().toLocaleDateString("ar-JO");

  // تحميل البيانات
  loadData();

  // فلترة
  document.getElementById("filterBtn").addEventListener("click", applyFilters);

  // إضافة إيراد
  document.getElementById("revForm").addEventListener("submit", async e => {
    e.preventDefault();
    const body = {
      date: new Date().toISOString().split("T")[0],
      amount: document.getElementById("amount").value,
      payment_method: document.getElementById("payment_type").value,
      tank_type: document.getElementById("tank_type").value,
      water_amount: document.getElementById("water_amount").value,
      source: document.getElementById("source_type").value,
      driver_name: document.getElementById("driver_name").value,
      vehicle_number: document.getElementById("vehicle_number").value,
      notes: document.getElementById("notes").value
    };
    await fetch(API, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });
    document.querySelector("#addModal .btn-close").click();
    loadData();
  });
});

// تحميل البيانات
async function loadData(filters = {}) {
  const tbody = document.getElementById("rows");
  tbody.innerHTML = `<tr><td colspan="8">جارٍ التحميل...</td></tr>`;
  try {
    const res = await fetch(API);
    const data = await res.json();
    renderTable(data);
  } catch {
    tbody.innerHTML = `<tr><td colspan="8" class="text-danger">⚠️ فشل تحميل البيانات</td></tr>`;
  }
}

function renderTable(data) {
  const tbody = document.getElementById("rows");
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-muted">لا توجد بيانات</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r.date || ""}</td>
      <td>${r.amount || ""}</td>
      <td>${r.payment_method || ""}</td>
      <td>${r.tank_type || ""}</td>
      <td>${r.water_amount || ""}</td>
      <td>${r.source || ""}</td>
      <td>${r.driver_name || ""}</td>
      <td>${r.vehicle_number || ""}</td>
    </tr>
  `).join("");
  document.getElementById("revCount").textContent = data.length;
}

// فلترة
async function applyFilters() {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const name = document.getElementById("filterName").value.trim();
  const car = document.getElementById("filterCar").value.trim();

  const res = await fetch(API);
  let data = await res.json();

  if (from) data = data.filter(r => new Date(r.date) >= new Date(from));
  if (to) data = data.filter(r => new Date(r.date) <= new Date(to));
  if (name) data = data.filter(r => (r.driver_name || "").includes(name));
  if (car) data = data.filter(r => (r.vehicle_number || "").includes(car));

  renderTable(data);
}

// طباعة جدول فقط
function printTable(id) {
  const table = document.getElementById(id).outerHTML;
  const win = window.open("", "_blank");
  win.document.write(`
    <html><head><title>طباعة الجدول</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet"/>
    </head><body dir="rtl" class="p-4">
    <h3 class="text-center mb-3">تقرير الإيرادات</h3>${table}</body></html>`);
  win.document.close();
  win.print();
}
