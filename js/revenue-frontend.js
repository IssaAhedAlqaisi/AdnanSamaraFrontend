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
  if (form) {
    form.addEventListener("submit", onCreateRevenue);
  }

  // زر تطبيق الفلترة
  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn) {
    filterBtn.addEventListener("click", applyFilters);
  }
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
    tb.innerHTML = `<tr><td colspan="9" class="text-danger text-center">فشل تحميل البيانات</td></tr>`;
    const rc = document.getElementById("revCount");
    if (rc) rc.textContent = "0";
  }
}

function renderTable(list) {
  const tb = document.getElementById("rows");
  const rc = document.getElementById("revCount");
  if (!tb) return;

  if (!list.length) {
    tb.innerHTML = `<tr><td colspan="9" class="text-center text-muted">لا توجد بيانات</td></tr>`;
    if (rc) rc.textContent = "0";
    return;
  }

  tb.innerHTML = list
    .map(
      (r) => `
    <tr>
      <td>${onlyDate(r.date) || "-"}</td>
      <td>${fmt(r.amount)}</td>
      <td>${r.payment_method || "-"}</td>
      <td>${r.tank_type || "-"}</td>
      <td>${extractWaterAmount(r.description) || "-"}</td>
      <td>${r.source_type || "-"}</td>
      <td>${r.driver_name || "-"}</td>
      <td>${r.vehicle_number || "-"}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteRevenue(${r.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>`
    )
    .join("");

  if (rc) rc.textContent = String(list.length);
}

// يستخرج رقم كمية المياه من الوصف إن وُجد
function extractWaterAmount(desc) {
  if (!desc) return null;
  const m = /(\d+(\.\d+)*)/.exec(desc);
  return m ? m[1] : null;
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
  };

  try {
    const res = await api.post("/revenue", payload);
    // نضيفه للذاكرة ونُعيد العرض
    if (res && res.revenue) {
      REVENUE_DATA.unshift(res.revenue);
      renderTable(REVENUE_DATA);
    }
    // اغلاق المودال وتنظيف
    f.reset();
    const closeBtn = document.querySelector('#addModal .btn-close');
    if (closeBtn) closeBtn.click();
  } catch (err) {
    console.error("❌ خطأ إضافة الإيراد:", err);
    alert("حدث خطأ أثناء الإضافة");
  }
}

/* =============== حذف =============== */
async function deleteRevenue(id) {
  if (!confirm("هل تريد حذف هذا الإيراد؟")) return;
  try {
    await api.delete(`/revenue/${id}`);
    // نحذف من الذاكرة ونُعيد العرض
    REVENUE_DATA = REVENUE_DATA.filter((r) => r.id !== id);
    renderTable(REVENUE_DATA);
  } catch (err) {
    console.error("❌ خطأ الحذف:", err);
    alert("فشل حذف السجل");
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
