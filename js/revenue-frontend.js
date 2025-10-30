/* global api */

// أدوات بسيطة
const fmt = (n) => (n == null ? "-" : Number(n).toFixed(2));
const onlyDate = (d) => (typeof d === "string" ? d.split("T")[0] : d);

// حالة داخلية
let REVENUE_DATA = [];

document.addEventListener("DOMContentLoaded", () => {
  // تحميل أولي
  loadRevenue();

  // حفظ إيراد جديد
  const form = document.getElementById("revForm");
  if (form) form.addEventListener("submit", onCreateRevenue);

  // زر تطبيق الفلترة
  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn) filterBtn.addEventListener("click", applyFilters);
});

/* =============== تحميل وعرض =============== */
async function loadRevenue() {
  const tb = document.getElementById("rows");
  if (!tb) return;
  try {
    const list = await api.get("/revenue");
    // نخزن النسخة الأصلية للفلترة
    REVENUE_DATA = Array.isArray(list) ? list : [];
    renderTable(REVENUE_DATA);
  } catch (err) {
    console.error("❌ خطأ تحميل الإيرادات:", err);
    tb.innerHTML = `<tr><td colspan="8" class="text-danger text-center">فشل تحميل البيانات</td></tr>`;
    const rc = document.getElementById("revCount");
    if (rc) rc.textContent = "0";
  }
}

function renderTable(list) {
  const tb = document.getElementById("rows");
  const rc = document.getElementById("revCount");
  if (!tb) return;

  if (!list.length) {
    tb.innerHTML = `<tr><td colspan="8" class="text-center text-muted">لا توجد بيانات</td></tr>`;
    if (rc) rc.textContent = "0";
    return;
  }

  tb.innerHTML = list
    .map((r) => {
      const pay =
        r.payment_type != null
          ? r.payment_type
          : r.payment_method != null
          ? r.payment_method
          : "-";
      return `
      <tr>
        <td>${onlyDate(r.date) || "-"}</td>
        <td>${fmt(r.amount)}</td>
        <td>${pay}</td>
        <td>${r.tank_type || "-"}</td>
        <td>${r.water_amount != null ? fmt(r.water_amount) : "-"}</td>
        <td>${r.source_type || "-"}</td>
        <td>${r.driver_name || "-"}</td>
        <td>${r.vehicle_number || "-"}</td>
      </tr>`;
    })
    .join("");

  if (rc) rc.textContent = String(list.length);
}

/* =============== إنشاء سجل جديد =============== */
async function onCreateRevenue(e) {
  e.preventDefault();
  const f = e.target;

  const payload = {
    amount: Number(f.amount.value || 0),
    payment_type: f.payment_type.value || "كاش",
    tank_type: f.tank_type.value || "نقلة مياه",
    water_amount: f.water_amount.value ? Number(f.water_amount.value) : null,
    source_type: f.source_type.value || "غير محدد",
    driver_name: f.driver_name.value || null,
    vehicle_number: f.vehicle_number.value || null,
    notes: f.notes.value || null,
    // التاريخ يضبطه الباكند تلقائياً، وحقل الواجهة للعرض فقط
  };

  try {
    const res = await api.post("/revenue", payload);
    // نضيفه للذاكرة ونُعيد العرض
    const created = res && (res.revenue || res.data || res);
    if (created) {
      REVENUE_DATA.unshift(created);
      renderTable(REVENUE_DATA);
    }
    // اغلاق المودال وتنظيف
    f.reset();
    const closeBtn = document.querySelector("#addModal .btn-close");
    if (closeBtn) closeBtn.click();
  } catch (err) {
    console.error("❌ خطأ إضافة الإيراد:", err);
    alert("حدث خطأ أثناء الإضافة");
  }
}

/* =============== فلترة =============== */
function applyFilters() {
  const fromDate = (document.getElementById("fromDate") || {}).value || "";
  const toDate   = (document.getElementById("toDate")   || {}).value || "";
  const driver   = (document.getElementById("filterName") || {}).value?.trim() || "";
  const carNo    = (document.getElementById("filterCar")  || {}).value?.trim() || "";

  const filtered = REVENUE_DATA.filter((r) => {
    // تاريخ
    const d = onlyDate(r.date) || "";
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;

    // اسم السائق
    if (driver && !(r.driver_name || "").includes(driver)) return false;

    // رقم المركبة
    if (carNo && !(r.vehicle_number || "").includes(carNo)) return false;

    return true;
  });

  renderTable(filtered);
}
