/* global api, bootstrap */

const fmt = (n) => (n == null || n === "" ? "-" : Number(n).toFixed(2));
const onlyDate = (d) => (typeof d === "string" ? d.split("T")[0] : d);

// ====== وسوم كمية المياه في الملاحظات ======
const WATER_TAG_RE = /\s*\[W=([0-9]+(?:\.[0-9]+)?)\]\s*/;
const WATER_TAG_RE_GLOBAL = /\s*\[W=[^\]]*\]\s*/g;

function readWaterFromRow(r) {
  if (r && r.water_amount != null && r.water_amount !== "") {
    const num = Number(r.water_amount);
    if (!Number.isNaN(num)) return num;
  }
  if (r && typeof r.notes === "string") {
    const m = r.notes.match(WATER_TAG_RE);
    if (m) return Number(m[1]);
  }
  return null;
}

function stampWaterInNotes(notes, waterVal) {
  const clean = (notes || "").replace(WATER_TAG_RE_GLOBAL, "").trim();
  if (waterVal == null || waterVal === "" || Number.isNaN(Number(waterVal))) {
    return clean;
  }
  return (clean ? clean + " " : "") + `[W=${Number(waterVal)}]`;
}

// ====== حالة داخلية ======
let REVENUE_DATA = [];
let CURRENT_VIEW = [];
let EDIT_ID = null;

document.addEventListener("DOMContentLoaded", () => {
  loadRevenue();

  const form = document.getElementById("revForm");
  if (form) form.addEventListener("submit", onSubmitRevenue);

  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn) filterBtn.addEventListener("click", applyFilters);

  const printInvoiceBtn = document.getElementById("printInvoiceBtn");
  if (printInvoiceBtn) printInvoiceBtn.addEventListener("click", printInvoiceForCurrentView);
});

/* =============== تحميل وعرض =============== */
async function loadRevenue() {
  const tb = document.getElementById("rows");
  if (!tb) return;
  try {
    const list = await api.get("/revenue");
    REVENUE_DATA = Array.isArray(list) ? list : [];
    renderTable(REVENUE_DATA);
  } catch (err) {
    console.error("❌ خطأ تحميل الإيرادات:", err);
    tb.innerHTML = `<tr><td colspan="10" class="text-danger text-center">فشل تحميل البيانات</td></tr>`;
    const rc = document.getElementById("revCount");
    if (rc) rc.textContent = "0";
  }
}

function renderTable(list) {
  const tb = document.getElementById("rows");
  const rc = document.getElementById("revCount");
  if (!tb) return;

  CURRENT_VIEW = list.slice();

  if (!list.length) {
    tb.innerHTML = `<tr><td colspan="10" class="text-center text-muted">لا توجد بيانات</td></tr>`;
    if (rc) rc.textContent = "0";
    return;
  }

  tb.innerHTML = list
    .map((r) => {
      const pay = r.payment_type ?? r.payment_method ?? "-";
      const water = readWaterFromRow(r);
      const cleanNotes = (r.notes || "").replace(WATER_TAG_RE_GLOBAL, "").trim() || "-";
      return `
      <tr>
        <td>${onlyDate(r.date) || "-"}</td>
        <td>${fmt(r.amount)}</td>
        <td>${pay}</td>
        <td>${r.tank_type || "-"}</td>
        <td>${water != null ? fmt(water) : "-"}</td>
        <td>${r.source_type || "-"}</td>
        <td>${r.driver_name || "-"}</td>
        <td>${r.vehicle_number || "-"}</td>
        <td>${cleanNotes}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" title="تعديل" onclick="startEdit(${r.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-sm btn-danger"  title="حذف"   onclick="deleteRevenue(${r.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
    })
    .join("");

  if (rc) rc.textContent = String(list.length);
}

/* =============== إنشاء/تعديل =============== */
function startEdit(id) {
  const row = REVENUE_DATA.find((x) => x.id === id);
  if (!row) return;

  EDIT_ID = id;
  document.getElementById("modalTitle").innerHTML = `<i class="fa-solid fa-pen me-2"></i> تعديل الإيراد`;
  document.getElementById("submitBtn").innerHTML = `<i class="fa-solid fa-save"></i> حفظ التعديل`;

  document.getElementById("date").value = onlyDate(row.date) || "";
  document.getElementById("amount").value = row.amount ?? "";
  document.getElementById("payment_type").value = (row.payment_type ?? row.payment_method) || "كاش";
  document.getElementById("tank_type").value = row.tank_type ?? "";

  const w = readWaterFromRow(row);
  document.getElementById("water_amount").value = w != null ? w : "";

  document.getElementById("source_type").value = row.source_type ?? "";
  document.getElementById("driver_name").value = row.driver_name ?? "";
  document.getElementById("vehicle_number").value = row.vehicle_number ?? "";
  document.getElementById("notes").value = (row.notes || "").replace(WATER_TAG_RE_GLOBAL, "").trim();

  const modal = new bootstrap.Modal(document.getElementById("addModal"));
  modal.show();
}

async function onSubmitRevenue(e) {
  e.preventDefault();
  const f = e.target;

  // ✅ التاريخ يدوي وإلزامي – لا أوتوماتيك
  const dateVal = (f.date && f.date.value && f.date.value.trim()) ? f.date.value.trim() : "";
  if (!dateVal) {
    alert("الرجاء إدخال التاريخ (إجباري).");
    return;
  }

  const payload = {
    date: dateVal,
    amount: Number(f.amount.value || 0),
    payment_type: f.payment_type.value || "كاش",
    tank_type: f.tank_type.value || "نقلة مياه",
    water_amount: f.water_amount.value ? Number(f.water_amount.value) : null,
    source_type: f.source_type.value || "غير محدد",
    driver_name: f.driver_name.value || null,     // يُعرض كـ "اسم العميل"
    vehicle_number: f.vehicle_number.value || null,
    notes: stampWaterInNotes(f.notes.value, f.water_amount.value ? Number(f.water_amount.value) : null),
  };

  try {
    if (EDIT_ID) {
      try {
        const res = await api.put(`/revenue/${EDIT_ID}`, payload);
        const updated = res && (res.revenue || res.data || res);
        if (updated) {
          const idx = REVENUE_DATA.findIndex((r) => r.id === EDIT_ID);
          if (idx > -1) REVENUE_DATA[idx] = { ...REVENUE_DATA[idx], ...updated };
        }
      } catch {
        // Fallback لو PUT غير متاح
        await api.delete(`/revenue/${EDIT_ID}`);
        const res = await api.post("/revenue", payload);
        const created = res && (res.revenue || res.data || res);
        if (created) {
          const idx = REVENUE_DATA.findIndex((r) => r.id === EDIT_ID);
          if (idx > -1) REVENUE_DATA[idx] = created;
        }
      }
    } else {
      const res = await api.post("/revenue", payload);
      const created = res && (res.revenue || res.data || res);
      if (created) REVENUE_DATA.unshift(created);
    }

    EDIT_ID = null;
    document.getElementById("modalTitle").innerHTML = `<i class="fa-solid fa-circle-plus me-2"></i> إضافة إيراد جديد`;
    document.getElementById("submitBtn").innerHTML = `<i class="fa-solid fa-check"></i> حفظ`;
    f.reset();

    const closeBtn = document.querySelector("#addModal .btn-close");
    if (closeBtn) closeBtn.click();

    renderTable(REVENUE_DATA);
  } catch (err) {
    console.error("❌ خطأ الحفظ:", err);
    alert("حدث خطأ أثناء الحفظ");
  }
}

/* =============== حذف =============== */
async function deleteRevenue(id) {
  if (!confirm("هل تريد حذف هذا الإيراد؟")) return;
  try {
    await api.delete(`/revenue/${id}`);
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
  const client   = (document.getElementById("filterName") || {}).value?.trim() || "";
  const carNo    = (document.getElementById("filterCar")  || {}).value?.trim() || "";

  const filtered = REVENUE_DATA.filter((r) => {
    const d = onlyDate(r.date) || "";
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    if (client && !(r.driver_name || "").includes(client)) return false;   // driver_name = اسم العميل
    if (carNo && !(r.vehicle_number || "").includes(carNo)) return false;
    return true;
  });

  renderTable(filtered);
}

/* =============== طباعة فاتورة للنتائج الحالية =============== */
function printInvoiceForCurrentView() {
  const rows = CURRENT_VIEW || [];
  if (!rows.length) {
    alert("لا توجد نتائج لطباعتها. طبّق الفلترة أولًا.");
    return;
  }

  const fromDate = (document.getElementById("fromDate") || {}).value || "";
  const toDate   = (document.getElementById("toDate")   || {}).value || "";
  const client   = (document.getElementById("filterName") || {}).value?.trim() || (rows[0].driver_name || "عميل");

  const totalAmount = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalWater  = rows.reduce((s, r) => s + (readWaterFromRow(r) || 0), 0);
  const invoiceNo   = "01-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

  const tableRows = rows
    .map((r) => {
      const water = readWaterFromRow(r);
      const cleanNotes = (r.notes || "").replace(WATER_TAG_RE_GLOBAL, "").trim() || "-";
      return `
      <tr>
        <td>${onlyDate(r.date) || "-"}</td>
        <td>${r.tank_type || "-"}</td>
        <td>${water != null ? fmt(water) : "-"}</td>
        <td>${r.payment_type ?? r.payment_method ?? "-"}</td>
        <td>${fmt(r.amount)}</td>
        <td>${cleanNotes}</td>
      </tr>`;
    })
    .join("");

  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(`<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة - ${client}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
<style>
body{font-family:"Cairo",sans-serif;padding:18px}
.inv-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.brand{font-weight:700;color:#1d4ed8}
.info-line{margin-top:4px}
.badge-no{font-weight:700}
th,td{text-align:center;vertical-align:middle}
@media print{body{margin:12px}}
</style>
</head><body>
<div class="inv-head">
  <div>
    <div class="brand">مؤسسة عدنان سمارة لنقل المياه</div>
    <div class="text-muted info-line">العنوان: ____________________</div>
    <div class="text-muted info-line">هاتف: ____________________</div>
  </div>
  <div class="text-end">
    <div class="badge bg-primary badge-no">رقم الفاتورة: ${invoiceNo}</div>
    <div>التاريخ: ${new Date().toLocaleDateString("ar-EG")}</div>
  </div>
</div>
<h5 class="mb-1">فاتورة عميل</h5>
<div class="mb-3">العميل: <b>${client}</b>${fromDate || toDate ? ` — الفترة: <b>${fromDate || "—"}</b> إلى <b>${toDate || "—"}</b>` : ""}</div>
<table class="table table-bordered">
  <thead class="table-light">
    <tr>
      <th>التاريخ</th><th>نوع النقلة</th><th>كمية المياه (م³)</th><th>طريقة الدفع</th><th>المبلغ (د.أ)</th><th>الملاحظات</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>
<div class="row mt-2">
  <div class="col-md-6">إجمالي عدد السجلات: <b>${rows.length}</b><br>إجمالي الكمية (م³): <b>${fmt(totalWater)}</b></div>
  <div class="col-md-6 text-end"><h5>الإجمالي المستحق: <b>${fmt(totalAmount)} د.أ</b></h5></div>
</div>
<small class="text-muted d-block mt-3">هذه الفاتورة مُولّدة من قسم الإيرادات — رمز الخدمة: 01 (مياه)</small>
<script>window.onload=function(){window.print();window.onfocus=function(){setTimeout(()=>window.close(),300);}}<\/script>
</body></html>`);
  w.document.close();
}
