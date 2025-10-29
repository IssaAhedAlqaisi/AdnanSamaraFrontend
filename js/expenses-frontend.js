// frontend/js/expenses-frontend.js

document.addEventListener('DOMContentLoaded', () => {
  // عبي التاريخ اليوم (عرض فقط)
  const dateInput = document.getElementById('dateInput');
  const today = new Date();
  dateInput.value = today.toISOString().slice(0, 10); // YYYY-MM-DD

  loadTypes();
  loadExpenses();

  document.getElementById('addExpenseForm').addEventListener('submit', onSubmitExpense);
  document.getElementById('addTypeBtn').addEventListener('click', onAddType);
  // عند فتح المودال نعيد تحميل الأنواع
  document.getElementById('manageTypesBtn')?.addEventListener('click', loadTypes);
});

/* ============ تحميل المصاريف ============ */
async function loadExpenses() {
  const tbody = document.getElementById('rows');
  try {
    const list = await expensesAPI.getAll();
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted">لا توجد بيانات</td></tr>`;
      document.getElementById('expCount').textContent = 0;
      return;
    }
    tbody.innerHTML = list.map((e) => `
      <tr>
        <td>${e.date?.slice(0,10) || '-'}</td>
        <td>${e.type || '-'}</td>
        <td>${Number(e.amount).toFixed(2)}</td>
        <td>${e.description || '-'}</td>
        <td>${e.beneficiary || '-'}</td>
        <td>${e.payment_method || '-'}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="delExpense(${e.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
    document.getElementById('expCount').textContent = list.length;
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-danger">فشل تحميل البيانات ⚠️</td></tr>`;
  }
}

/* ============ إضافة مصروف ============ */
async function onSubmitExpense(ev) {
  ev.preventDefault();

  const amount = document.getElementById('amountInput').value;
  const type = document.getElementById('typeSelect').value || null;
  const payment_method = document.getElementById('paymentSelect').value || 'كاش';
  const beneficiary = document.getElementById('beneficiaryInput').value || null;
  const description = document.getElementById('descriptionInput').value || null;
  const notes = document.getElementById('notesInput').value || null;

  try {
    await expensesAPI.create({ amount, type, payment_method, beneficiary, description, notes });
    // سكّر المودال
    bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'))?.hide();
    // صفّي النموذج
    ev.target.reset();
    document.getElementById('dateInput').value = new Date().toISOString().slice(0,10);
    // حدّث الجدول
    loadExpenses();
  } catch (err) {
    alert('فشل في إضافة المصروف: ' + err.message);
  }
}

/* ============ حذف مصروف ============ */
async function delExpense(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
  try {
    await expensesAPI.delete(id);
    loadExpenses();
  } catch (err) {
    alert('فشل حذف المصروف: ' + err.message);
  }
}

/* ============ الأنواع ============ */
async function loadTypes() {
  const listEl = document.getElementById('typesList');
  const select = document.getElementById('typeSelect');
  try {
    const types = await expensesAPI.getTypes();
    // القائمة داخل المودال
    if (listEl) {
      listEl.innerHTML = types.length
        ? types.map(t => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
              ${t.name}
              <button class="btn btn-sm btn-outline-danger" onclick="delType(${t.id})"><i class="fa-solid fa-trash"></i></button>
            </li>
          `).join('')
        : `<li class="list-group-item text-muted">لا توجد أنواع بعد</li>`;
    }
    // الـ select في نموذج الإضافة
    if (select) {
      select.innerHTML = `<option value="">— اختر النوع —</option>` +
        types.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    }
  } catch (err) {
    if (listEl) listEl.innerHTML = `<li class="list-group-item text-danger">فشل تحميل الأنواع</li>`;
  }
}

async function onAddType(ev) {
  ev.preventDefault();
  const input = document.getElementById('newTypeName');
  const name = (input.value || '').trim();
  if (!name) return;
  try {
    await expensesAPI.addType(name);
    input.value = '';
    await loadTypes();
  } catch (err) {
    alert('فشل إضافة النوع: ' + err.message);
  }
}

async function delType(id) {
  if (!confirm('حذف هذا النوع؟')) return;
  try {
    await expensesAPI.deleteType(id);
    await loadTypes();
  } catch (err) {
    alert('فشل حذف النوع: ' + err.message);
  }
}

/* ============ طباعة الجدول ============ */
function printTable(tableId) {
  const html = document.getElementById(tableId).outerHTML;
  const w = window.open('', '_blank', 'width=1024,height=768');
  w.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>طباعة</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet" />
      </head>
      <body class="p-4">
        ${html}
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
      </body>
    </html>
  `);
  w.document.close();
}
