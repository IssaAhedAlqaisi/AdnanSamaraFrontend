// frontend/js/expenses-frontend.js
// يفترض وجود api/expensesAPI في api.js كما هو عندك

document.addEventListener('DOMContentLoaded', () => {
  initExpensesPage();
});

async function initExpensesPage() {
  // تعبئة التاريخ الافتراضي في نموذج الإضافة
  const dateInput = document.getElementById('expenseDate');
  if (dateInput) dateInput.value = todayISO();

  // تحميل المصاريف
  await loadExpenses();

  // ربط زر فتح مودال الأنواع
  const btnTypes = document.getElementById('openTypesModalBtn');
  if (btnTypes) btnTypes.addEventListener('click', openTypesModal);

  // ربط حفظ مصروف
  const form = document.getElementById('expenseForm');
  if (form) {
    form.addEventListener('submit', onSubmitExpense);
  }

  // ربط زر طباعة الجدول
  const printBtn = document.getElementById('printTableBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => printTable('expensesTable'));
  }

  // حمّل الأنواع لقائمة الاختيار في نموذج الإضافة
  await populateTypesSelect();
}

/* ------------ Helpers ------------- */
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function toast(msg) { alert(msg); }

/* ------------ تحميل المصاريف ------------- */
async function loadExpenses() {
  const tbody = document.querySelector('#expensesTable tbody');
  try {
    const data = await expensesAPI.getAll(); // من api.js
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">لا توجد بيانات</td></tr>`;
      updateTotal(0);
      return;
    }
    let total = 0;
    tbody.innerHTML = data.map(row => {
      total += Number(row.amount || 0);
      return `
        <tr>
          <td>${row.date?.slice(0,10) || ''}</td>
          <td>${row.type_name || '-'}</td>
          <td>${Number(row.amount || 0).toFixed(2)}</td>
          <td>${row.description || '-'}</td>
          <td>${row.beneficiary || '-'}</td>
          <td>${row.pay_method || '-'}</td>
          <td>
            <!-- ممكن تضيف حذف لاحقًا -->
          </td>
        </tr>
      `;
    }).join('');
    updateTotal(total);
  } catch (e) {
    console.error(e);
    const tbody = document.querySelector('#expensesTable tbody');
    tbody.innerHTML = `<tr><td colspan="7" class="text-danger text-center">⚠️ فشل تحميل البيانات</td></tr>`;
    updateTotal(0);
  }
}

function updateTotal(sum) {
  const el = document.getElementById('expensesTotal');
  if (el) el.textContent = sum.toFixed(2);
}

/* ------------ إضافة مصروف ------------- */
async function onSubmitExpense(e) {
  e.preventDefault();
  const f = e.target;

  const payload = {
    date: f.expenseDate.value || todayISO(),
    type_id: f.typeId.value ? Number(f.typeId.value) : null,
    amount: Number(f.amount.value),
    beneficiary: f.beneficiary.value || null,
    pay_method: f.paymentMethod.value, // 'cash' | 'visa' | 'ذمم'
    description: f.description.value || null,
    notes: f.notes.value || null,
  };

  if (!payload.amount || !payload.pay_method) {
    return toast('رجاءً املأ المبلغ وطريقة الدفع');
  }

  try {
    await expensesAPI.create(payload);
    // اغلاق المودال إن وجد
    const closeBtn = document.querySelector('#addExpenseModal .btn-close');
    if (closeBtn) closeBtn.click();
    f.reset();
    f.expenseDate.value = todayISO();
    await loadExpenses();
  } catch (err) {
    console.error(err);
    toast('فشل في إضافة المصروف');
  }
}

/* ------------ إدارة الأنواع (مودال) ------------- */
async function openTypesModal() {
  // افتح المودال (bootstrap)
  const mEl = document.getElementById('typesModal');
  if (!mEl) return;
  const modal = new bootstrap.Modal(mEl);
  modal.show();

  await renderTypesList();
}

async function renderTypesList() {
  const list = document.getElementById('typesList');
  if (!list) return;
  list.innerHTML = `<li class="list-group-item text-muted">...جاري التحميل</li>`;
  try {
    const types = await expensesAPI.getTypes();
    if (!types.length) {
      list.innerHTML = `<li class="list-group-item text-muted">لا توجد أنواع</li>`;
      return;
    }
    list.innerHTML = types.map(t => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${t.name}</span>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteExpenseType(${t.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </li>
    `).join('');
  } catch (e) {
    console.error(e);
    list.innerHTML = `<li class="list-group-item text-danger">فشل تحميل الأنواع</li>`;
  }
}

async function deleteExpenseType(id) {
  if (!confirm('حذف هذا النوع؟')) return;
  try {
    await expensesAPI.deleteType(id);
    await renderTypesList();
    await populateTypesSelect();
  } catch (e) {
    console.error(e);
    toast('لا يمكن حذف النوع (قد يكون مستخدمًا)');
  }
}

async function addExpenseType() {
  const input = document.getElementById('newTypeName');
  if (!input || !input.value.trim()) return;
  try {
    await expensesAPI.createType({ name: input.value.trim() });
    input.value = '';
    await renderTypesList();
    await populateTypesSelect();
  } catch (e) {
    console.error(e);
    toast('فشل إضافة النوع');
  }
}

/* ------------ تعبئة قائمة الأنواع في نموذج المصروف ------------- */
async function populateTypesSelect() {
  const select = document.getElementById('typeId');
  if (!select) return;
  try {
    const types = await expensesAPI.getTypes();
    select.innerHTML = `<option value="">— اختر النوع —</option>` +
      types.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  } catch (e) {
    console.error(e);
    select.innerHTML = `<option value="">تعذر تحميل الأنواع</option>`;
  }
}

/* ------------ طباعة جدول المصاريف فقط ------------- */
function printTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const win = window.open('', '_blank', 'width=1000,height=700');
  win.document.write(`
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة الجدول</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet" />
    </head>
    <body class="p-3">
      <h4 class="mb-3">جدول المصاريف</h4>
      ${table.outerHTML}
      <script>window.onload = () => window.print();</script>
    </body>
    </html>
  `);
  win.document.close();
}
