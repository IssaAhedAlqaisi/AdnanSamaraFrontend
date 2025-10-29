/* ===============================
   المصاريف — Frontend Controller
   يعتمد على api.js (expensesAPI)
   =============================== */

// عناصر أساسية
const rowsTbody         = document.getElementById('rows');
const revCountEl        = document.getElementById('expCount');        // إجمالي عدد المصاريف
const addBtn            = document.getElementById('openAddModalBtn'); // زر فتح مودال الإضافة
const addModalEl        = document.getElementById('addExpenseModal');
const typesBtn          = document.getElementById('openTypesModalBtn');
const typesModalEl      = document.getElementById('typesModal');

// عناصر نموذج إضافة مصروف
const form              = document.getElementById('expenseForm');
const amountInput       = document.getElementById('amount');
const dateInput         = document.getElementById('date');
const typeSelect        = document.getElementById('type_id');
const payMethodSelect   = document.getElementById('pay_method');
const beneficiaryInput  = document.getElementById('beneficiary');
const descriptionInput  = document.getElementById('description');
const notesInput        = document.getElementById('notes');

// عناصر إدارة الأنواع
const newTypeNameInput  = document.getElementById('newTypeName');
const addTypeBtn        = document.getElementById('addTypeBtn');
const typesList         = document.getElementById('typesList');

// Bootstrap Modals
const addModal   = new bootstrap.Modal(addModalEl);
const typesModal = new bootstrap.Modal(typesModalEl);

// تنسيق تاريخ اليوم yyyy-mm-dd
function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// طباعة جدول محدد
function printTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const w = window.open('', '_blank');
  w.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>طباعة الجدول</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet" />
        <style>
          body { padding: 16px; font-family: "Cairo", sans-serif; }
          table { direction: rtl; }
        </style>
      </head>
      <body>
        ${table.outerHTML}
        <script>window.onload = () => { window.print(); window.close(); };</script>
      </body>
    </html>
  `);
  w.document.close();
}

// تحميل الأنواع للقائمتين (السيلكت + قائمة الإدارة)
async function loadTypes() {
  try {
    const types = await expensesAPI.getTypes();

    // املأ select النوع
    typeSelect.innerHTML = `<option value="">— اختر النوع —</option>`;
    for (const t of types) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      typeSelect.appendChild(opt);
    }

    // املأ قائمة الإدارة
    typesList.innerHTML = '';
    if (!types.length) {
      typesList.innerHTML = `<li class="list-group-item text-muted">لا توجد أنواع بعد</li>`;
    } else {
      for (const t of types) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
          <span>${t.name}</span>
          <button class="btn btn-sm btn-danger" data-id="${t.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        `;
        li.querySelector('button').addEventListener('click', async () => {
          if (!confirm(`حذف نوع "${t.name}"؟`)) return;
          try {
            await expensesAPI.deleteType(t.id);
            await loadTypes();
          } catch (err) {
            alert('فشل حذف النوع: ' + err.message);
          }
        });
        typesList.appendChild(li);
      }
    }
  } catch (err) {
    // في حال الخطأ، يظهر رسالة بسيطة ولا ينهار
    typeSelect.innerHTML = `<option value="">— فشل تحميل الأنواع —</option>`;
    typesList.innerHTML = `<li class="list-group-item text-danger">فشل تحميل الأنواع</li>`;
  }
}

// تحميل بيانات المصاريف
async function loadExpenses() {
  try {
    const data = await expensesAPI.getAll();
    rowsTbody.innerHTML = '';
    if (!data.length) {
      rowsTbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted">لا توجد بيانات</td>
        </tr>`;
    } else {
      for (const row of data) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.date?.slice(0,10) || '-'}</td>
          <td>${row.type_name || '-'}</td>
          <td>${Number(row.amount || 0).toFixed(2)}</td>
          <td>${row.pay_method || '-'}</td>
          <td>${row.beneficiary || '-'}</td>
          <td>${row.description || '-'}</td>
          <td>
            <button class="btn btn-sm btn-danger" data-id="${row.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;
        tr.querySelector('button').addEventListener('click', async () => {
          if (!confirm('حذف هذا المصروف؟')) return;
          try {
            await expensesAPI.delete(row.id);
            await loadExpenses();
            updateCount();
          } catch (err) {
            alert('فشل الحذف: ' + err.message);
          }
        });
        rowsTbody.appendChild(tr);
      }
    }
    updateCount();
  } catch (err) {
    rowsTbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">فشل تحميل البيانات</td>
      </tr>`;
  }
}

function updateCount() {
  if (!revCountEl) return;
  const count = rowsTbody.querySelectorAll('tr').length;
  // لو فيه صف "لا توجد بيانات" اعتبر العدد 0
  const realCount = rowsTbody.querySelector('td.text-muted') ? 0 : count;
  revCountEl.textContent = realCount;
}

// فتح مودال إضافة مصروف
addBtn?.addEventListener('click', async () => {
  // قيم افتراضية
  form.reset();
  dateInput.value = todayISO();
  payMethodSelect.value = 'كاش';
  await loadTypes();
  addModal.show();
});

// فتح مودال إدارة الأنواع
typesBtn?.addEventListener('click', async () => {
  newTypeNameInput.value = '';
  await loadTypes();
  typesModal.show();
});

// إضافة نوع جديد
addTypeBtn?.addEventListener('click', async () => {
  const name = (newTypeNameInput.value || '').trim();
  if (!name) {
    alert('اكتب اسم النوع أولاً');
    return;
  }
  try {
    await expensesAPI.addType(name);
    newTypeNameInput.value = '';
    await loadTypes();
  } catch (err) {
    alert('فشل إضافة النوع: ' + err.message);
  }
});

// حفظ مصروف جديد
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    amount: Number((amountInput.value || '').trim()),
    date: (dateInput.value || todayISO()).trim(),
    type_id: typeSelect.value ? Number(typeSelect.value) : null,
    pay_method: (payMethodSelect.value || '').trim(),
    beneficiary: (beneficiaryInput.value || '').trim(),
    description: (descriptionInput.value || '').trim(),
    notes: (notesInput.value || '').trim()
  };

  // تحققات بسيطة
  if (!payload.amount || isNaN(payload.amount)) {
    alert('رجاءً أدخل مبلغ صحيح');
    return;
  }
  if (!payload.type_id) {
    alert('اختر نوع المصروف');
    return;
  }

  try {
    await expensesAPI.create(payload);
    addModal.hide();
    await loadExpenses();
    updateCount();
  } catch (err) {
    alert('فشل في إضافة المصروف: ' + err.message);
  }
});

// طباعة الجدول الرئيسي
document.getElementById('printMainBtn')?.addEventListener('click', () => {
  printTable('dataTable');
});

// تشغيل أولي
(function init() {
  // اجعل تاريخ الحقل اليوم
  if (dateInput) dateInput.value = todayISO();
  // حمّل البيانات
  loadExpenses();
})();
