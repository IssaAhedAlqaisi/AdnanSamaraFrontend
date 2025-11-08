/* ===============================
   المصاريف — Frontend Controller
   يعتمد على api.js أو expensesAPI (تلقائيًا)
   =============================== */

document.addEventListener('DOMContentLoaded', () => {
  // واجهة آمنة: تشتغل على expensesAPI لو موجود، وإلّا تستخدم api مباشرة.
  const EAPI = (window.expensesAPI) ? window.expensesAPI : {
    async getAll()         { return api.get('/expenses'); },
    async delete(id)       { return api.delete(`/expenses/${id}`); },
    async create(payload)  { return api.post('/expenses', payload); },
    async update(id, pld)  {
      try { return await api.put(`/expenses/${id}`, pld); }
      catch { await api.delete(`/expenses/${id}`); return api.post('/expenses', pld); }
    },
    async getTypes()       { return api.get('/expense-types'); },
    async addType(name)    { return api.post('/expense-types', { name }); },
    async deleteType(id)   { return api.delete(`/expense-types/${id}`); },
  };

  // عناصر أساسية
  const rowsTbody   = document.getElementById('rows');
  const revCountEl  = document.getElementById('expCount');
  const addBtn      = document.getElementById('openAddModalBtn');
  const addModalEl  = document.getElementById('addExpenseModal');
  const typesBtn    = document.getElementById('openTypesModalBtn');
  const typesModalEl= document.getElementById('typesModal');

  // عناصر نموذج
  const form            = document.getElementById('expenseForm');
  const amountInput     = document.getElementById('amount');
  const dateInput       = document.getElementById('date');
  const typeSelect      = document.getElementById('type_id');
  const payMethodSelect = document.getElementById('pay_method');
  const beneficiaryInput= document.getElementById('beneficiary');
  const descriptionInput= document.getElementById('description');
  const notesInput      = document.getElementById('notes');
  const addEditTitleEl  = document.getElementById('addEditTitle');
  const saveBtnEl       = document.getElementById('saveBtn');

  // Modals (أنشئ فقط إذا العنصر موجود)
  const addModal   = addModalEl   ? new bootstrap.Modal(addModalEl)   : null;
  const typesModal = typesModalEl ? new bootstrap.Modal(typesModalEl) : null;

  // حالة
  let EXPENSES_DATA = [];
  let EDIT_ID = null;

  function todayISO(){
    const d = new Date(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function printTable(tableId){
    const table = document.getElementById(tableId);
    if (!table) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html dir="rtl" lang="ar"><head><meta charset="UTF-8" />
        <title>طباعة الجدول</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet" />
        <style>body{padding:16px;font-family:"Cairo",sans-serif}table{direction:rtl}</style>
      </head><body>
        ${table.outerHTML}
        <script>window.onload=()=>{window.print();window.close();};<\/script>
      </body></html>
    `);
    w.document.close();
  }

  async function loadTypes(){
    try{
      const types = await EAPI.getTypes();
      // select
      if (typeSelect){
        typeSelect.innerHTML = `<option value="">— اختر النوع —</option>`;
        (types||[]).forEach(t=>{
          const opt = document.createElement('option');
          opt.value = t.id; opt.textContent = t.name;
          typeSelect.appendChild(opt);
        });
      }
      // قائمة الإدارة
      const typesList = document.getElementById('typesList');
      const addTypeBtn = document.getElementById('addTypeBtn');
      const newTypeNameInput = document.getElementById('newTypeName');
      if (typesList){
        typesList.innerHTML = '';
        if (!types?.length){
          typesList.innerHTML = `<li class="list-group-item text-muted">لا توجد أنواع بعد</li>`;
        } else {
          types.forEach(t=>{
            const li = document.createElement('li');
            li.className='list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `<span>${t.name}</span>
              <button class="btn btn-sm btn-danger"><i class="fa-solid fa-trash"></i></button>`;
            li.querySelector('button').addEventListener('click', async ()=>{
              if (!confirm(`حذف نوع "${t.name}"؟`)) return;
              await EAPI.deleteType(t.id); await loadTypes();
            });
            typesList.appendChild(li);
          });
        }
      }
      // إضافة نوع
      if (addTypeBtn && newTypeNameInput && !addTypeBtn.dataset.bound){
        addTypeBtn.dataset.bound = '1';
        addTypeBtn.addEventListener('click', async ()=>{
          const name = (newTypeNameInput.value||'').trim();
          if (!name){ alert('اكتب اسم النوع أولاً'); return; }
          await EAPI.addType(name); newTypeNameInput.value=''; await loadTypes();
        });
      }
    }catch{
      if (typeSelect) typeSelect.innerHTML = `<option value="">— فشل تحميل الأنواع —</option>`;
      const typesList = document.getElementById('typesList');
      if (typesList) typesList.innerHTML = `<li class="list-group-item text-danger">فشل تحميل الأنواع</li>`;
    }
  }

  async function loadExpenses(){
    try{
      const data = await EAPI.getAll();
      EXPENSES_DATA = Array.isArray(data) ? data : [];
      rowsTbody.innerHTML = '';

      if (!EXPENSES_DATA.length){
        rowsTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">لا توجد بيانات</td></tr>`;
      } else {
        EXPENSES_DATA.forEach(row=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${row.date?.slice(0,10) || '-'}</td>
            <td>${row.type_name || '-'}</td>
            <td>${Number(row.amount || 0).toFixed(2)}</td>
            <td>${row.pay_method || '-'}</td>
            <td>${row.beneficiary || '-'}</td>
            <td>${row.description || '-'}</td>
            <td class="d-flex justify-content-center gap-1">
              <button class="btn btn-sm btn-warning" title="تعديل"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-sm btn-danger"  title="حذف"><i class="fa-solid fa-trash"></i></button>
            </td>`;

          // حذف
          tr.querySelector('.btn-danger').addEventListener('click', async ()=>{
            if (!confirm('حذف هذا المصروف؟')) return;
            await EAPI.delete(row.id);
            await loadExpenses(); updateCount();
          });

          // تعديل
          tr.querySelector('.btn-warning').addEventListener('click', async ()=>{
            EDIT_ID = row.id;
            await loadTypes();
            if (addEditTitleEl) addEditTitleEl.innerHTML = `<i class="fa-solid fa-pen me-2"></i> تعديل مصروف`;
            if (saveBtnEl)      saveBtnEl.innerHTML      = `<i class="fa-solid fa-save"></i> حفظ التعديل`;

            amountInput.value      = row.amount ?? '';
            dateInput.value        = row.date?.slice(0,10) ?? todayISO();
            payMethodSelect.value  = row.pay_method ?? 'كاش';
            beneficiaryInput.value = row.beneficiary ?? '';
            descriptionInput.value = row.description ?? '';
            notesInput.value       = row.notes ?? '';

            if (row.type_id){
              typeSelect.value = String(row.type_id);
            } else if (row.type_name){
              const opt = Array.from(typeSelect.options).find(o=>o.textContent===row.type_name);
              if (opt) typeSelect.value = opt.value;
            }
            addModal?.show();
          });

          rowsTbody.appendChild(tr);
        });
      }
      updateCount();
    }catch(err){
      console.error('LOAD EXPENSES ERROR:', err);
      rowsTbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">فشل تحميل البيانات</td></tr>`;
    }
  }

  function updateCount(){
    if (!revCountEl) return;
    const visible = Array.from(rowsTbody.querySelectorAll('tr'))
      .filter(tr=> tr.style.display !== 'none' && tr.querySelectorAll('td').length).length;
    const emptyMsg = rowsTbody.querySelector('td.text-muted');
    revCountEl.textContent = emptyMsg ? 0 : visible;
  }

  // فتح مودال إضافة
  addBtn?.addEventListener('click', async ()=>{
    EDIT_ID = null;
    form?.reset();
    if (addEditTitleEl) addEditTitleEl.innerHTML = `<i class="fa-solid fa-circle-plus me-2"></i> إضافة مصروف جديد`;
    if (saveBtnEl)      saveBtnEl.innerHTML      = `<i class="fa-solid fa-check"></i> حفظ`;
    if (dateInput) dateInput.value = todayISO();
    if (payMethodSelect) payMethodSelect.value = 'كاش';
    await loadTypes();
    addModal?.show();
  });

  // فتح إدارة الأنواع
  typesBtn?.addEventListener('click', async ()=>{
    const newTypeNameInput = document.getElementById('newTypeName');
    if (newTypeNameInput) newTypeNameInput.value = '';
    await loadTypes();
    typesModal?.show();
  });

  // حفظ (إضافة/تعديل)
  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = {
      amount: Number((amountInput.value||'').trim()),
      date:   (dateInput.value || todayISO()).trim(),
      type_id: typeSelect.value ? Number(typeSelect.value) : null,
      pay_method: (payMethodSelect.value||'').trim(),
      beneficiary: (beneficiaryInput.value||'').trim(),
      description: (descriptionInput.value||'').trim(),
      notes: (notesInput.value||'').trim()
    };
    if (!payload.amount || isNaN(payload.amount)){ alert('رجاءً أدخل مبلغ صحيح'); return; }
    if (!payload.type_id){ alert('اختر نوع المصروف'); return; }

    try{
      if (EDIT_ID) await EAPI.update(EDIT_ID, payload);
      else         await EAPI.create(payload);

      addModal?.hide();
      EDIT_ID = null;
      await loadExpenses(); updateCount();
    }catch(err){
      alert('فشل الحفظ: ' + (err?.message || err));
    }
  });

  // زر طباعة الجدول
  document.getElementById('printMainBtn')?.addEventListener('click', ()=> printTable('dataTable'));

  // تشغيل أولي
  if (dateInput) dateInput.value = todayISO();
  loadExpenses();
});
