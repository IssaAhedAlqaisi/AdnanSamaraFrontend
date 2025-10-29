// js/expenses-frontend.js

// عناصر الصفحة
const tbody = document.querySelector("#expensesRows");
const countBox = document.querySelector("#expensesCount");

// أزرار
const addBtn = document.getElementById("addExpenseBtn");          // زر فتح مودال إضافة مصروف
const printBtn = document.getElementById("printBtn");              // زر طباعة الجدول
const manageTypesBtn = document.getElementById("manageTypesBtn");  // زر إدارة الأنواع

// المودالات + عناصرها
const addModal = document.getElementById("addExpenseModal");
const addForm  = document.getElementById("addExpenseForm");

// حقول المودال (IDs مطابقة لتصميمك الحالي)
const fldAmount      = document.getElementById("amount");
const fldType        = document.getElementById("type_id");     // <select> للأنواع
const fldDate        = document.getElementById("date");        // input[type=date]
const fldPayMethod   = document.getElementById("pay_method");  // <select> كاش/فيزا/ذمم
const fldBeneficiary = document.getElementById("beneficiary");
const fldDesc        = document.getElementById("description");
const fldNotes       = document.getElementById("notes");

// مودال إدارة الأنواع
const typesModal = document.getElementById("typesModal");
const typesList  = document.getElementById("typesList");
const typeNameInput = document.getElementById("newTypeName");
const addTypeBtn    = document.getElementById("addTypeBtn");

// ============= Util =============
function alertx(msg) { window.alert(msg); }

function fmtDateOnly(d) {
  if (!d) return "";
  return String(d).slice(0,10);
}

function printTable() {
  const table = document.getElementById("expensesTable");
  const w = window.open("", "_blank");
  w.document.write(`
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>طباعة المصاريف</title>
        <style>
          body { font-family: Cairo, Tahoma, Arial; padding: 16px; }
          table { width:100%; border-collapse: collapse; }
          th, td { border:1px solid #ccc; padding:8px; text-align:center; }
          thead { background:#e7f0ff; }
        </style>
      </head>
      <body>${table.outerHTML}</body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}

// ============= تحميل الأنواع =============
async function loadTypesIntoSelect() {
  try {
    const types = await expensesAPI.getTypes();
    fldType.innerHTML = `<option value="">اختر النوع...</option>` +
      types.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  } catch (e) {
    console.error(e);
    // خلّي القائمة فاضية لكن ما نكسر إضافة مصروف
    fldType.innerHTML = `<option value="">لا يوجد أنواع</option>`;
  }
}

async function refreshTypesModalList() {
  try {
    const types = await expensesAPI.getTypes();
    typesList.innerHTML = types.map(t => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${t.name}</span>
        <button class="btn btn-sm btn-danger" data-del="${t.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </li>
    `).join("");
  } catch (e) {
    typesList.innerHTML = `<li class="list-group-item text-muted">...جارِ التحميل</li>`;
  }
}

// ============= تحميل المصاريف =============
async function loadExpenses() {
  try {
    const data = await expensesAPI.getAll();
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-muted">لا توجد بيانات</td></tr>`;
      countBox.textContent = "0";
      return;
    }
    tbody.innerHTML = data.map(row => `
      <tr>
        <td>${fmtDateOnly(row.date)}</td>
        <td>${row.type_name || "-"}</td>
        <td>${Number(row.amount).toFixed(2)}</td>
        <td>${row.pay_method || "-"}</td>
        <td>${row.beneficiary || "-"}</td>
        <td>${row.description || "-"}</td>
        <td>${row.notes || "-"}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="delExpense(${row.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
    countBox.textContent = String(data.length);
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="8" class="text-danger">فشل تحميل البيانات ⚠️</td></tr>`;
    countBox.textContent = "0";
  }
}
window.delExpense = async function(id) {
  if (!confirm("هل تريد حذف هذا المصروف؟")) return;
  await expensesAPI.delete(id);
  loadExpenses();
};

// ============= أحداث المودالات =============
addBtn?.addEventListener("click", async () => {
  // ضبط التاريخ تلقائيًا (yyyy-mm-dd)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const dd = String(today.getDate()).padStart(2,'0');
  fldDate.value = `${yyyy}-${mm}-${dd}`;

  fldAmount.value = "";
  fldType.value = "";
  fldPayMethod.value = "كاش";
  fldBeneficiary.value = "";
  fldDesc.value = "";
  fldNotes.value = "";

  await loadTypesIntoSelect();
  // Bootstrap Modal إن لزم
});

manageTypesBtn?.addEventListener("click", async () => {
  typeNameInput.value = "";
  await refreshTypesModalList();
});

// إضافة نوع جديد
addTypeBtn?.addEventListener("click", async () => {
  const name = typeNameInput.value.trim();
  if (!name) return;
  try {
    await expensesAPI.addType(name);
    typeNameInput.value = "";
    await refreshTypesModalList();
    await loadTypesIntoSelect(); // حتى يظهر مباشرة في المودال الآخر
  } catch (e) {
    console.error(e);
    alertx(`فشل إضافة النوع: ${e.message}`);
  }
});

// حذف نوع من داخل المودال
typesList?.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-del]");
  if (!btn) return;
  const id = btn.getAttribute("data-del");
  if (!confirm("حذف هذا النوع؟")) return;
  try {
    await expensesAPI.deleteType(id);
    await refreshTypesModalList();
    await loadTypesIntoSelect();
  } catch (e2) {
    console.error(e2);
    alertx("فشل حذف النوع");
  }
});

// إرسال نموذج إضافة مصروف
addForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const payload = {
      date:        fldDate?.value || null,
      type_id:     fldType?.value ? Number(fldType.value) : null,
      amount:      fldAmount?.value ? Number(fldAmount.value) : null,
      beneficiary: (fldBeneficiary?.value || "").trim(),
      pay_method:  fldPayMethod?.value || null,
      description: (fldDesc?.value || "").trim(),
      notes:       (fldNotes?.value || "").trim()
    };

    if (!payload.amount) {
      alertx("المبلغ مطلوب");
      return;
    }

    await expensesAPI.create(payload);

    // اغلق المودال (Bootstrap)
    const modal = bootstrap.Modal.getInstance(addModal) || new bootstrap.Modal(addModal);
    modal.hide();

    await loadExpenses();
  } catch (err) {
    console.error(err);
    alertx(`فشل في إضافة المصروف: ${err.message}`);
  }
});

printBtn?.addEventListener("click", printTable);

// أول تحميل
(async function init() {
  await loadTypesIntoSelect();
  await loadExpenses();
})();
