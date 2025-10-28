// frontend/js/revenue-frontend.js

// ✅ تفعيل القائمة الجانبية (فتح/إغلاق)
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar-wrapper");
  const pageContent = document.getElementById("page-content-wrapper");
  const toggleBtn = document.getElementById("menu-toggle");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar?.classList.toggle("collapsed");
      pageContent?.classList.toggle("expanded");
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // التاريخ المعروض (عرض فقط)
  const dateInput = document.getElementById("date");
  if (dateInput) {
    const today = new Date();
    dateInput.value = today.toLocaleDateString("ar-JO");
  }

  // تحميل البيانات فورًا
  loadRevenue();

  // ربط زر الفلترة
  document.getElementById("filterBtn")?.addEventListener("click", applyFilters);

  // منع الإرسال الافتراضي وحفظ الإيراد
  const form = document.getElementById("revForm");
  if (form) {
    form.addEventListener("submit", onSubmitRevenue);
    form.setAttribute("onsubmit", "return false;");
  }
});

// =================== تحميل & رسم الجدول ===================
async function loadRevenue() {
  const tbody = document.getElementById("rows");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8">جارٍ التحميل...</td></tr>`;

  try {
    const data = await revenueAPI.getAll(); // يعتمد على api.js
    renderTable(data);
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="8" class="text-danger">⚠️ فشل تحميل البيانات</td></tr>`;
  }
}

function renderTable(data) {
  const tbody = document.getElementById("rows");
  if (!tbody) return;

  if (!Array.isArray(data) || !data.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-muted">لا توجد بيانات</td></tr>`;
    document.getElementById("revCount") && (document.getElementById("revCount").textContent = "0");
    return;
  }

  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${safe(r.date)}</td>
      <td>${num(r.amount)}</td>
      <td>${safe(r.payment_method)}</td>
      <td>${safe(r.tank_type)}</td>
      <td>${safe(r.water_amount)}</td>
      <td>${safe(r.source)}</td>
      <td>${safe(r.driver_name)}</td>
      <td>${safe(r.vehicle_number)}</td>
    </tr>
  `).join("");

  const cnt = document.getElementById("revCount");
  if (cnt) cnt.textContent = String(data.length);
}

// =================== إضافة إيراد ===================
async function onSubmitRevenue(e) {
  e.preventDefault();

  // نفس IDs الحالية في HTML (لا نستخدم name هنا)
  const payload = {
    amount: Number(document.getElementById("amount")?.value || 0),
    payment_method: (document.getElementById("payment_type")?.value || "").trim(),
    tank_type: (document.getElementById("tank_type")?.value || "").trim(),
    water_amount: (document.getElementById("water_amount")?.value || "").trim(),
    source: (document.getElementById("source_type")?.value || "").trim(),
    driver_name: (document.getElementById("driver_name")?.value || "").trim(),
    vehicle_number: (document.getElementById("vehicle_number")?.value || "").trim(),
    notes: (document.getElementById("notes")?.value || "").trim()
  };

  if (!payload.amount) {
    alert("⚠️ المبلغ مطلوب");
    return;
  }

  try {
    await revenueAPI.create(payload);
    // اغلاق المودال + إعادة تحميل:
    document.querySelector("#addModal .btn-close")?.click();
    clearRevenueForm();
    await loadRevenue();
    alert("✅ تمت الإضافة بنجاح");
  } catch (err) {
    console.error(err);
    alert(err?.error || "⚠️ فشل إضافة الإيراد");
  }
}

function clearRevenueForm() {
  ["amount","payment_type","tank_type","water_amount","source_type","driver_name","vehicle_number","notes"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}

// =================== فلترة (على العميل) ===================
async function applyFilters() {
  const from = document.getElementById("fromDate")?.value;
  const to = document.getElementById("toDate")?.value;
  const name = (document.getElementById("filterName")?.value || "").trim();
  const car = (document.getElementById("filterCar")?.value || "").trim();

  try {
    let data = await revenueAPI.getAll();
    if (from) data = data.filter(r => new Date(r.date) >= new Date(from));
    if (to) data = data.filter(r => new Date(r.date) <= new Date(to));
    if (name) data = data.filter(r => (r.driver_name || "").includes(name));
    if (car) data = data.filter(r => (r.vehicle_number || "").includes(car));
    renderTable(data);
  } catch (e) {
    console.error(e);
  }
}

// =================== طباعة الجدول ===================
function printTable(id) {
  const table = document.getElementById(id)?.outerHTML || "";
  const win = window.open("", "_blank");
  win.document.write(`
    <html><head><title>طباعة الجدول</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet"/>
    </head><body dir="rtl" class="p-4">
    <h3 class="text-center mb-3">تقرير الإيرادات</h3>${table}</body></html>`);
  win.document.close();
  win.print();
}

// helpers
function safe(v){ return (v ?? "").toString().replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
function num(x){ return Number(x || 0).toFixed(2); }
