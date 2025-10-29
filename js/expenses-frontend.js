// frontend/js/expenses-frontend.js

/* ===== Helpers ===== */
const todayISO = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const mapPayMethod = (v) => {
  if (!v) return 'cash';
  const s = String(v).trim();
  if (['كاش', 'نقد', 'cash'].includes(s)) return 'cash';
  if (['فيزا', 'بطاقة', 'visa'].includes(s)) return 'visa';
  if (['ذمم', 'آجل', 'credit'].includes(s)) return 'credit';
  return 'cash';
};

/* ===== Types UI ===== */
const typesBtn = document.getElementById('btnManageTypes');     // إدارة الأنواع
const typesList = document.getElementById('typesList');         // <ul> أو <div> لقائمة الأنواع
const typeSelect = document.getElementById('expenseType');      // <select> في مودال الإضافة

async function refreshTypes() {
  try {
    const list = await api.get('/expenses/types');
    // عبّي السيلكت
    typeSelect.innerHTML = `<option value="">— اختر النوع —</option>` + list
      .map(t => `<option value="${t.id}" data-name="${t.name}">${t.name}</option>`)
      .join('');

    // عبّي قائمة الإدارة إن وجدت
    if (typesList) {
      typesList.innerHTML = list.map(t => `
        <li class="d-flex justify-content-between align-items-center py-1">
          <span>${t.name}</span>
          <button class="btn btn-sm btn-outline-danger" data-del="${t.id}"><i class="fa-solid fa-trash"></i></button>
        </li>
      `).join('');
      typesList.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('حذف هذا النوع؟')) return;
          await api.delete('/expenses/types/' + btn.dataset.del);
          refreshTypes();
        });
      });
    }
  } catch {
    // ممكن تعرض رسالة لطيفة، لكن ما نوقف الصفحة
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // تعبئة الأنواع عند الفتح
  refreshTypes();

  // التاريخ الافتراضي في المودال (بدون وقت)
  const dateInput = document.getElementById('expenseDate');
  if (dateInput && !dateInput.value) dateInput.value = todayISO();

  // تحميل المصاريف
  loadExpenses();

  // حفظ مصروف
  const form = document.getElementById('addExpenseForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;

      const amount = parseFloat(f.amount.value);
      if (!amount || isNaN(amount)) {
        alert('الرجاء إدخال مبلغ صالح.');
        return;
      }

      // نوع المصروف: إمّا id من السيلكت، أو لو بدك تتركه فاضي وبتضيف النوع من شاشة إدارة الأنواع
      const selected = f.expenseType.options[f.expenseType.selectedIndex];
      const type_id = selected && selected.value ? parseInt(selected.value) : null;
      const type_name = selected && selected.dataset && selected.dataset.name ? selected.dataset.name : (selected?.textContent || '').trim();

      const payload = {
        amount,
        date: (f.expenseDate.value || '').trim(),             // لو فاضي السيرفر يحط CURRENT_DATE
        pay_method: mapPayMethod(f.pay_method.value),
        beneficiary: (f.beneficiary.value || '').trim() || null,
        description: (f.description.value || '').trim() || null,
        notes: (f.notes.value || '').trim() || null,
      };

      if (type_id) payload.type_id = type_id;
      else if (type_name) payload.type_name = type_name;

      try {
        await api.post('/expenses', payload);
        // اغلاق + تحديث
        if (document.querySelector('#addExpenseModal .btn-close')) {
          document.querySelector('#addExpenseModal .btn-close').click();
        }
        f.reset();
        if (dateInput) dateInput.value = todayISO(); // بعد الريسِت رجّع التاريخ
        loadExpenses();
      } catch (err) {
        alert('فشل في إضافة المصروف: ' + (err?.message || ''));
      }
    });
  }

  // زر طباعة الجدول
  const printBtn = document.getElementById('btnPrintExpenses');
  if (printBtn) {
    printBtn.addEventListener('click', () => printTable('expensesTable'));
  }
});

/* ===== عرض الجدول ===== */
async function loadExpenses() {
  const tbody = document.querySelector('#expensesTable tbody');
  if (!tbody) return;
  try {
    const list = await api.get('/expenses');
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted">لا توجد سجلات</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(r => `
      <tr>
        <td>${(r.date || '').slice(0,10)}</td>
        <td>${r.amount?.toFixed ? r.amount.toFixed(2) : r.amount}</td>
        <td>${r.pay_method === 'cash' ? 'كاش' : r.pay_method === 'visa' ? 'فيزا' : 'ذمم'}</td>
        <td>${r.type_name || '-'}</td>
        <td>${r.beneficiary || '-'}</td>
        <td>${r.description || '-'}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="delExpense(${r.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="7" class="text-danger">فشل تحميل البيانات ⚠️</td></tr>`;
  }
}

async function delExpense(id) {
  if (!confirm('حذف هذا المصروف؟')) return;
  await api.delete('/expenses/' + id);
  loadExpenses();
}

/* ===== طباعة جدول واحد ===== */
function printTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const head = document.querySelector('head').innerHTML;
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(`
    <html dir="rtl" lang="ar">
      <head>${head}<style>
        body { font-family: "Cairo", sans-serif; padding: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
        thead { background: #e5eefc; }
      </style></head>
      <body>${table.outerHTML}</body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}
