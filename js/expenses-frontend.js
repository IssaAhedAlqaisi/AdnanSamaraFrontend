// frontend/js/expenses-frontend.js

class ExpensesUI {
  constructor() {
    this.expenses = [];
    this.types = [];
    this.init();
  }

  async init() {
    this.setTodayDefault();
    await Promise.all([this.loadTypes(), this.loadExpenses()]);
    this.bindForm();
    this.bindTypesModal();
  }

  setTodayDefault() {
    const inp = document.querySelector('input[name="date"]');
    if (inp && !inp.value) {
      inp.value = new Date().toISOString().split('T')[0]; // YYYY-MM-DD فقط
    }
  }

  async loadTypes() {
    try {
      this.types = await expensesAPI.getTypes();
    } catch {
      this.types = [];
    }
    this.renderTypesSelect();
    this.renderTypesList();
  }

  renderTypesSelect() {
    const select = document.getElementById('typeSelect');
    if (!select) return;
    if (!this.types.length) {
      select.innerHTML = `<option value="" disabled selected>لا توجد أنواع بعد — أضف نوعًا من "إدارة الأنواع"</option>`;
    } else {
      select.innerHTML = this.types.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    }
  }

  renderTypesList() {
    const ul = document.getElementById('typesList');
    if (!ul) return;
    if (!this.types.length) {
      ul.innerHTML = `<li class="list-group-item text-muted text-center">لا توجد أنواع بعد</li>`;
      return;
    }
    ul.innerHTML = this.types.map(t => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${t.name}</span>
        <button class="btn btn-sm btn-danger" data-del-type="${t.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </li>
    `).join('');
  }

  async loadExpenses() {
    try {
      this.expenses = await expensesAPI.getAll();
    } catch {
      this.expenses = [];
    }
    this.renderExpensesTable();
    this.updateTotals();
  }

  renderExpensesTable() {
    const tbody = document.querySelector('#expensesTable tbody');
    if (!tbody) return;
    if (!this.expenses.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted">لا توجد بيانات</td></tr>`;
      return;
    }
    tbody.innerHTML = this.expenses.map(e => `
      <tr>
        <td>${this.formatDate(e.date)}</td>
        <td>${e.type || '-'}</td>
        <td>${this.formatAmount(e.amount)}</td>
        <td>${e.description || '-'}</td>
        <td>${e.beneficiary || '-'}</td>
        <td>${e.payment_method || '-'}</td>
        <td>
          <button class="btn btn-sm btn-warning" data-edit="${e.id}">
            <i class="fa-solid fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" data-del="${e.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // bind actions
    tbody.querySelectorAll('[data-edit]').forEach(b => {
      b.addEventListener('click', () => this.fillFormForEdit(+b.dataset.edit));
    });
    tbody.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', () => this.deleteExpense(+b.dataset.del));
    });
  }

  updateTotals() {
    const total = this.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const el = document.getElementById('totalExpenses');
    if (el) el.textContent = `${total.toLocaleString('ar-EG')} دينار`;
  }

  formatDate(d) {
    try {
      return new Date(d).toLocaleDateString('ar-EG');
    } catch { return d || '-'; }
  }
  formatAmount(a) {
    const n = Number(a) || 0;
    return `${n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  bindForm() {
    const form = document.getElementById('expenseForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);

      const payload = {
        date: fd.get('date') || null, // لو فاضي يحفظ CURRENT_DATE من السيرفر
        type: fd.get('type'),
        amount: parseFloat(fd.get('amount') || '0'),
        beneficiary: fd.get('beneficiary') || null,
        payment_method: fd.get('payment_method') || 'كاش',
        description: fd.get('description') || null,
        notes: fd.get('notes') || null
      };

      try {
        const id = fd.get('id');
        if (id) {
          await expensesAPI.update(id, payload);
        } else {
          await expensesAPI.create(payload);
        }
        await this.loadExpenses();
        form.reset();
        this.setTodayDefault();
        bootstrap.Modal.getInstance(document.getElementById('addExpenseModal')).hide();
      } catch (err) {
        alert('خطأ في الحفظ: ' + (err?.message || ''));
      }
    });
  }

  fillFormForEdit(id) {
    const e = this.expenses.find(x => x.id === id);
    if (!e) return;
    const m = new bootstrap.Modal(document.getElementById('addExpenseModal'));
    const form = document.getElementById('expenseForm');

    form.querySelector('[name="id"]').value = e.id;
    form.querySelector('[name="date"]').value = e.date?.slice(0,10) || new Date().toISOString().slice(0,10);
    this.ensureTypeExistsThenSelect(e.type);
    form.querySelector('[name="amount"]').value = e.amount ?? '';
    form.querySelector('[name="beneficiary"]').value = e.beneficiary ?? '';
    form.querySelector('[name="payment_method"]').value = e.payment_method ?? 'كاش';
    form.querySelector('[name="description"]').value = e.description ?? '';
    form.querySelector('[name="notes"]').value = e.notes ?? '';

    m.show();
  }

  async ensureTypeExistsThenSelect(name) {
    if (!name) return;
    if (!this.types.find(t => t.name === name)) {
      try { await expensesAPI.addType(name); } catch {}
      await this.loadTypes();
    }
    const sel = document.getElementById('typeSelect');
    if (sel) sel.value = name;
  }

  async deleteExpense(id) {
    if (!confirm('هل تريد حذف هذا المصروف؟')) return;
    try {
      await expensesAPI.delete(id);
      await this.loadExpenses();
    } catch (err) {
      alert('فشل الحذف: ' + (err?.message || ''));
    }
  }

  bindTypesModal() {
    const addBtn = document.getElementById('addTypeBtn');
    const nameInp = document.getElementById('newTypeName');
    const list = document.getElementById('typesList');

    if (addBtn) {
      addBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const name = (nameInp.value || '').trim();
        if (!name) return;
        try {
          await expensesAPI.addType(name);
          nameInp.value = '';
          await this.loadTypes();
        } catch (err) {
          alert('فشل إضافة النوع: ' + (err?.message || ''));
        }
      });
    }

    if (list) {
      list.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-del-type]');
        if (!btn) return;
        const id = +btn.dataset.delType;
        if (!confirm('حذف هذا النوع؟')) return;
        try {
          await expensesAPI.deleteType(id);
          await this.loadTypes();
        } catch (err) {
          alert('فشل حذف النوع: ' + (err?.message || ''));
        }
      });
    }

    // حدث فتح المودال: تحدّث القائمة
    const modalEl = document.getElementById('typesModal');
    if (modalEl) {
      modalEl.addEventListener('show.bs.modal', () => this.loadTypes());
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.expensesUI = new ExpensesUI();
});
