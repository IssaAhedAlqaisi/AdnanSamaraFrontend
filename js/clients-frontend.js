// js/clients-frontend.js

// يعتمد على clientsAPI الموجود داخل js/api.js
// تأكد أن API_BASE_URL مضبوط على خدمة Render الصحيحة:
// const API_BASE_URL = 'https://adnansamarabackend-1.onrender.com/api';

class ClientsManager {
  constructor() {
    this.clients = [];
    this.tbody = document.getElementById('rows');
    this.countEl = document.getElementById('clientCount');
    this.form = document.getElementById('addForm');
  }

  async init() {
    this.bindForm();
    await this.loadClients();
  }

  async loadClients() {
    try {
      const data = await clientsAPI.getAll();
      this.clients = Array.isArray(data) ? data : [];
      if (!this.clients.length) {
        this.tbody.innerHTML = `<tr><td colspan="8" class="text-muted">لا توجد بيانات</td></tr>`;
        this.countEl.textContent = '0';
        return;
      }

      this.tbody.innerHTML = this.clients.map(c => `
        <tr>
          <td>${this.esc(c.name)}</td>
          <td>${this.esc(c.phone)}</td>
          <td>${this.esc(c.area)}</td>
          <td>${this.esc(c.address || '-')}</td>
          <td>${this.esc(c.type || '-')}</td>
          <td>${this.esc(c.source || '-')}</td>
          <td>${this.esc(c.notes || '-')}</td>
          <td>
            <button class="btn btn-sm btn-danger" data-id="${c.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');

      this.countEl.textContent = this.clients.length.toString();

      // bind delete
      this.tbody.querySelectorAll('button.btn-danger').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('هل تريد حذف هذا العميل؟')) return;
          try {
            await clientsAPI.delete(id);
            await this.loadClients();
          } catch (e) {
            console.error('Delete client error:', e);
            alert('فشل حذف العميل');
          }
        });
      });

    } catch (err) {
      console.error('Error loading clients:', err);
      this.tbody.innerHTML = `<tr><td colspan="8" class="text-danger">⚠️ فشل تحميل البيانات</td></tr>`;
      this.countEl.textContent = '0';
    }
  }

  bindForm() {
    if (!this.form) return;
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this.form).entries());

      const payload = {
        name: (data.name || '').trim(),
        phone: (data.phone || '').trim(),
        area: (data.area || '').trim(),
        address: data.address || '',
        type: data.type || 'regular',
        source: data.source || 'reference',
        notes: data.notes || '',
        status: data.status || 'active'
      };

      if (!payload.name || !payload.phone || !payload.area) {
        alert('الاسم والهاتف والمنطقة حقول مطلوبة');
        return;
      }

      try {
        await clientsAPI.create(payload);
        // إغلاق المودال
        const modalEl = document.getElementById('addModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();

        this.form.reset();
        await this.loadClients();
      } catch (err) {
        console.error('Create client error:', err);
        alert('فشل حفظ العميل');
      }
    });
  }

  esc(v) {
    return (v ?? '').toString().replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[s]));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const cm = new ClientsManager();
  cm.init();
});
