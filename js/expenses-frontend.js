/* ===============================
   المصاريف — Frontend Controller
   يعتمد على api.js (expensesAPI إن وجد)
   =============================== */

// ===== واجهة آمنة للـ API (Fallback) =====
const EAPI = (()=>{
  if (window.expensesAPI) return window.expensesAPI;

  const tryGet = async (urls) => {
    for (const u of urls) {
      try { const r = await api.get(u); if (r) return r; } catch (_) {}
    }
    throw new Error("GET failed");
  };
  const tryPost = async (urls, payload) => {
    for (const u of urls) {
      try { return await api.post(u, payload); } catch (_) {}
    }
    throw new Error("POST failed");
  };
  const tryDelete = async (urls, id) => {
    for (const u of urls) {
      try { return await api.delete(`${u}/${id}`); } catch (_) {}
    }
    throw new Error("DELETE failed");
  };
  const tryPut = async (urls, id, payload) => {
    for (const u of urls) {
      try { return await api.put(`${u}/${id}`, payload); } catch (_) {}
    }
    throw new Error("PUT failed");
  };

  const EXPENSES = ["/expenses", "/expense"];
  const TYPES    = ["/expense-types", "/expenses/types", "/types"];

  return {
    async getAll()        { return tryGet(EXPENSES); },
    async create(p)       { return tryPost(EXPENSES, p); },
    async delete(id)      { return tryDelete(EXPENSES, id); },
    async update(id, p)   {
      try { return await tryPut(EXPENSES, id, p); }
      catch {
        await tryDelete(EXPENSES, id);
        return tryPost(EXPENSES, p);
      }
    },
    async getTypes() {
      const raw = await (async ()=>{ try { return await tryGet(TYPES); } catch { return []; } })();
      if (!Array.isArray(raw)) return [];
      return raw.map(t=>{
        if (typeof t === "string") return { id: null, name: t };
        return { id: t.id ?? t._id ?? t.value ?? null, name: t.name ?? t.title ?? t.label ?? "" };
      });
    },
    async addType(name)   { return tryPost(TYPES, { name }); },
    async deleteType(id)  { return tryDelete(TYPES, id); },
  };
})();

// ===== عناصر الصفحة =====
const rowsTbody        = document.getElementById('rows');
const revCountEl       = document.getElementById('expCount');
const addBtn           = document.getElementById('openAddModalBtn');
const addModalEl       = document.getElementById('addExpenseModal');
const typesBtn         = document.getElementById('openTypesModalBtn');
const typesModalEl     = document.getElementById('typesModal');

const form             = document.getElementById('expenseForm');
const amountInput      = document.getElementById('amount');
const dateInput        = document.getElementById('date');
const typeSelect       = document.getElementById('type_id');
const payMethodSelect  = document.getElementById('pay_method');
const beneficiaryInput = document.getElementById('beneficiary');
const descriptionInput = document.getElementById('description');
const notesInput       = document.getElementById('notes');

const newTypeNameInput = document.getElementById('newTypeName');
const addTypeBtn       = document.getElementById('addTypeBtn');
const typesList        = document.getElementById('typesList');

const addModal         = new bootstrap.Modal(addModalEl);
const typesModal       = new bootstrap.Modal(typesModalEl);

const filterFromEl     = document.getElementById('filterFrom');
const filterToEl       = document.getElementById('filterTo');
const filterOwnerEl    = document.getElementById('filterOwner');
const applyFilterBtn   = document.getElementById('applyFilterBtn');
const clearFilterBtn   = document.getElementById('clearFilterBtn');

const addModalTitle    = document.getElementById('addModalTitle');
const saveExpenseBtn   = document.getElementById('saveExpenseBtn');

let EDIT_ID = null;
let EXPENSES_DATA = [];
let CURRENT_VIEW  = [];

// ===== أدوات =====
function todayISO(){
  const d = new Date(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function fmt(n){ return (n==null||n==="")? "-" : Number(n).toFixed(2); }

// ===== طباعة جدول عام =====
function printTable(tableId){
  const table = document.getElementById(tableId);
  if (!table) return;
  const w = window.open('', '_blank');
  w.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>طباعة الجدول</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet" />
        <style>body{padding:16px;font-family:"Cairo",sans-serif}</style>
      </head>
      <body>
        ${table.outerHTML}
        <script>window.onload = () => { window.print(); window.close(); };</script>
      </body>
    </html>
  `);
  w.document.close();
}

// ===== تحميل الأنواع =====
async function loadTypes(){
  try{
    const types = await EAPI.getTypes();

    // select
    typeSelect.innerHTML = `<option value="">— اختر النوع —</option>`;
    for (const t of types){
      const id   = t.id;
      const text = t.name;
      if (id==null && !text) continue;
      const opt = document.createElement('option');
      opt.value = id ?? text;
      opt.textContent = text;
      typeSelect.appendChild(opt);
    }

    // قائمة الإدارة
    typesList.innerHTML = '';
    if (!types.length){
      typesList.innerHTML = `<li class="list-group-item text-muted">لا توجد أنواع بعد</li>`;
    }else{
      for (const t of types){
        const li = document.createElement('li');
        const canDelete = t.id != null;
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
          <span>${t.name}</span>
          <button class="btn btn-sm btn-danger" ${canDelete? "" : "disabled"}>
            <i class="fa-solid fa-trash"></i>
          </button>
        `;
        if (canDelete){
          li.querySelector('button').addEventListener('click', async ()=>{
            if (!confirm(`حذف نوع "${t.name}"؟`)) return;
            await EAPI.deleteType(t.id);
            await loadTypes();
          });
        }
        typesList.appendChild(li);
      }
    }
  }catch{
    typeSelect.innerHTML = `<option value="">— فشل تحميل الأنواع —</option>`;
    typesList.innerHTML = `<li class="list-group-item text-danger">فشل تحميل الأنواع</li>`;
  }
}

// ===== تحميل المصاريف =====
async function loadExpenses(){
  try{
    const data = await EAPI.getAll();
    EXPENSES_DATA = Array.isArray(data) ? data : [];
    renderTable(EXPENSES_DATA);
  }catch(err){
    rowsTbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">فشل تحميل البيانات</td></tr>`;
    revCountEl.textContent = "0";
  }
}

// ===== عرض الجدول =====
function renderTable(list){
  CURRENT_VIEW = list.slice();

  if (!list.length){
    rowsTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">لا توجد بيانات</td></tr>`;
    revCountEl.textContent = "0";
    return;
  }

  rowsTbody.innerHTML = list.map(row=>{
    return `
      <tr>
        <td>${row.date?.slice(0,10) || '-'}</td>
        <td>${row.type_name || '-'}</td>
        <td>${fmt(row.amount)}</td>
        <td>${row.pay_method || '-'}</td>
        <td>${row.beneficiary || '-'}</td>
        <td>${row.description || '-'}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" title="تعديل" onclick="startEdit(${row.id})">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-sm btn-danger" title="حذف" onclick="deleteExpense(${row.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  applyUIFilters(); // حافظ على الفلترة الحالية إن كانت موجودة
}

// ===== تحديث العدّاد بناءً على الصفوف الظاهرة =====
function updateCountFromVisible(){
  const visible = Array.from(rowsTbody.querySelectorAll('tr'))
    .filter(tr => tr.style.display !== 'none' && tr.querySelectorAll('td').length).length;
  revCountEl.textContent = String(visible);
}

// ===== فلترة واجهة =====
function applyUIFilters(){
  const from = (filterFromEl.value || '');
  const to   = (filterToEl.value   || '');
  const own  = (filterOwnerEl.value || '').trim();

  let shown = 0;
  Array.from(rowsTbody.querySelectorAll('tr')).forEach(tr=>{
    const tds = tr.querySelectorAll('td');
    if (!tds.length) return;

    const d = (tds[0]?.innerText || '').trim();
    const owner = (tds[4]?.innerText || '').trim();

    let ok = true;
    if (from && d < from) ok = false;
    if (to   && d > to)   ok = false;
    if (own && !owner.includes(own)) ok = false;

    tr.style.display = ok ? '' : 'none';
    if (ok) shown++;
  });

  revCountEl.textContent = String(shown);
}

// ===== إضافة/تعديل =====
function resetFormForCreate(){
  EDIT_ID = null;
  form.reset();
  dateInput.value = todayISO();
  payMethodSelect.value = 'كاش';
  addModalTitle.innerHTML = `<i class="fa-solid fa-circle-plus me-2"></i> إضافة مصروف جديد`;
  saveExpenseBtn.innerHTML = `<i class="fa-solid fa-check"></i> حفظ`;
}

window.startEdit = function(id){
  const row = EXPENSES_DATA.find(r=>r.id===id);
  if (!row) return;

  EDIT_ID = id;
  addModalTitle.innerHTML = `<i class="fa-solid fa-pen me-2"></i> تعديل المصروف`;
  saveExpenseBtn.innerHTML = `<i class="fa-solid fa-save"></i> حفظ التعديل`;

  amountInput.value      = row.amount ?? '';
  dateInput.value        = row.date ? row.date.slice(0,10) : todayISO();
  payMethodSelect.value  = row.pay_method || 'كاش';
  beneficiaryInput.value = row.beneficiary || '';
  descriptionInput.value = row.description || '';
  notesInput.value       = row.notes || '';

  // ضبط النوع
  const currentTypeId = row.type_id ?? null;
  const currentTypeName = row.type_name ?? "";
  if (currentTypeId != null){
    typeSelect.value = String(currentTypeId);
  } else if (currentTypeName){
    const opt = Array.from(typeSelect.options).find(o=>o.textContent===currentTypeName);
    if (opt) typeSelect.value = opt.value;
  }

  addModal.show();
};

window.deleteExpense = async function(id){
  if (!confirm('حذف هذا المصروف؟')) return;
  try{
    await EAPI.delete(id);
    await loadExpenses();
  }catch(err){
    alert('فشل الحذف: ' + err.message);
  }
};

form?.addEventListener('submit', async (e)=>{
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

  if (!payload.amount || isNaN(payload.amount)){ alert('رجاءً أدخل مبلغ صحيح'); return; }
  if (!payload.type_id){ alert('اختر نوع المصروف'); return; }

  try{
    if (EDIT_ID){
      await EAPI.update(EDIT_ID, payload);
    }else{
      await EAPI.create(payload);
    }
    addModal.hide();
    resetFormForCreate();
    await loadExpenses();
  }catch(err){
    alert('فشل الحفظ: ' + (err?.message || ''));
  }
});

// ===== إدارة الأنواع =====
addBtn?.addEventListener('click', async ()=>{
  resetFormForCreate();
  await loadTypes();
  addModal.show();
});
typesBtn?.addEventListener('click', async ()=>{
  newTypeNameInput.value = '';
  await loadTypes();
  typesModal.show();
});
addTypeBtn?.addEventListener('click', async ()=>{
  const name = (newTypeNameInput.value || '').trim();
  if (!name){ alert('اكتب اسم النوع أولاً'); return; }
  try{
    await EAPI.addType(name);
    newTypeNameInput.value = '';
    await loadTypes();
  }catch(err){
    alert('فشل إضافة النوع: ' + err.message);
  }
});

// ===== طباعة الجدول =====
document.getElementById('printMainBtn')?.addEventListener('click', ()=> printTable('dataTable'));

// ===== فلترة =====
applyFilterBtn?.addEventListener('click', applyUIFilters);
clearFilterBtn?.addEventListener('click', ()=>{
  filterFromEl.value = ''; filterToEl.value = ''; filterOwnerEl.value = '';
  Array.from(rowsTbody.querySelectorAll('tr')).forEach(tr=> tr.style.display = '');
  updateCountFromVisible();
});

// ===== تشغيل أولي =====
(function init(){
  if (dateInput) dateInput.value = todayISO();
  loadTypes().finally(loadExpenses);
})();
