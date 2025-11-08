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

// عناصر نموذج إضافة/تعديل مصروف
const form              = document.getElementById('expenseForm');
const amountInput       = document.getElementById('amount');
const dateInput         = document.getElementById('date');
const typeSelect        = document.getElementById('type_id');
const payMethodSelect   = document.getElementById('pay_method');
const beneficiaryInput  = document.getElementById('beneficiary');
const descriptionInput  = document.getElementById('description');
const notesInput        = document.getElementById('notes');
const addEditTitleEl    = document.getElementById('addEditTitle');
const saveBtnEl         = document.getElementById('saveBtn');

// عناصر إدارة الأنواع
const newTypeNameInput  = document.getElementById('newTypeName');
const addTypeBtn        = document.getElementById('addTypeBtn');
const typesList         = document.getElementById('typesList');

// Bootstrap Modals
const addModal   = new bootstrap.Modal(addModalEl);
const typesModal = new bootstrap.Modal(typesModalEl);

// حالة داخلية
let EXPENSES_DATA = [];
let EDIT_ID = null;

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
          if (!confirm(\`حذف نوع "${t.name}"؟\`)) return;
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
    typeSelect.innerHTML = `<option value="">— فشل تحميل الأنواع —</option>`;
    typesList.innerHTML = `<li class="list-group-item text-danger">فشل تحميل الأنواع</li>`;
  }
}

// تحميل بيانات المصاريف
async function loadExpenses() {
  try {
    const data = await expensesAPI.getAll();
    EXPENSES_DATA = Array.isArray(data) ? data : [];
    rowsTbody.innerHTML = '';

    if (!EXPENSES_DATA.length) {
      rowsTbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted">لا توجد بيانات</td>
        </tr>`;
    } else {
      for (const row of EXPENSES_DATA) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.date?.slice(0,10) || '-'}</td>
          <td>${row.type_name || '-'}</td>
          <td>${Number(row.amount || 0).toFixed(2)}</td>
          <td>${row.pay_method || '-'}</td>
          <td>${row.beneficiary || '-'}</td>
          <td>${row.description || '-'}</td>
          <td class="d-flex justify-content-center gap-1">
            <button class="btn btn-sm btn-warning" data-edit-id="${row.id}" title="تعديل">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-danger" data-id="${row.id}" title="حذف">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;

        // حذف
        tr.querySelector('button.btn-danger').addEventListener('click', async () => {
          if (!confirm('حذف هذا المصروف؟')) return;
          try {
            await expensesAPI.delete(row.id);
            await loadExpenses();
            updateCount();
          } catch (err) {
            alert('فشل الحذف: ' + err.message);
          }
        });

        // تعديل
        tr.querySelector('button.btn-warning').addEventListener('click', async () => {
          EDIT_ID = row.id;
          await loadTypes(); // تأكد السيلكت جاهز
          addEditTitleEl.innerHTML = `<i class="fa-solid fa-pen me-2"></i> تعديل مصروف`;
          saveBtnEl.innerHTML = `<i class="fa-solid fa-save"></i> حفظ التعديل`;

          amountInput.value      = row.amount ?? '';
          dateInput.value        = row.date?.slice(0,10) ?? todayISO();
          payMethodSelect.value  = row.pay_method ?? 'كاش';
          beneficiaryInput.value = row.beneficiary ?? '';
          descriptionInput.value = row.description ?? '';
          notesInput.value       = row.notes ?? '';

          // ضبط النوع
          if (row.type_id) {
            typeSelect.value = String(row.type_id);
          } else if (row.type_name) {
            const opt = Array.from(typeSelect.options).find(o => o.textContent === row.type_name);
            if (opt) typeSelect.value = opt.value;
          }

          addModal.show();
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
  const visible = Array.from(rowsTbody.querySelectorAll('tr'))
    .filter(tr => tr.style.display !== 'none' && tr.querySelectorAll('td').length)
    .length;
  const isEmptyMsg = rowsTbody.querySelector('td.text-muted');
  revCountEl.textContent = isEmptyMsg ? 0 : visible;
}

// فتح مودال إضافة مصروف
addBtn?.addEventListener('click', async () => {
  // قيم افتراضية
  EDIT_ID = null;
  form.reset();
  addEditTitleEl.innerHTML = `<i class="fa-solid fa-circle-plus me-2"></i> إضافة مصروف جديد`;
  saveBtnEl.innerHTML = `<i class="fa-solid fa-check"></i> حفظ`;
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

// حفظ (إضافة أو تعديل) مصروف
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
    if (EDIT_ID) {
      // إن توفر end-point للتحديث
      if (typeof expensesAPI.update === 'function') {
        await expensesAPI.update(EDIT_ID, payload);
      } else {
        // Fallback: حذف ثم إضافة
        await expensesAPI.delete(EDIT_ID);
        await expensesAPI.create(payload);
      }
    } else {
      await expensesAPI.create(payload);
    }

    addModal.hide();
    EDIT_ID = null;
    await loadExpenses();
    updateCount();
  } catch (err) {
    alert('فشل الحفظ: ' + err.message);
  }
});

// طباعة الجدول الرئيسي
document.getElementById('printMainBtn')?.addEventListener('click', () => {
  printTable('dataTable');
});

// تشغيل أولي
(function init() {
  if (dateInput) dateInput.value = todayISO();
  loadExpenses();
})();
