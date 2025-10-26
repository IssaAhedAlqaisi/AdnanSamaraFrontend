// تحميل الجدول
async function loadRevenue() {
  const tbody = document.getElementById("rows");
  try {
    const data = await revenueAPI.getAll(); // /revenue
    if (!data || !data.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">لا توجد بيانات</td></tr>`;
      document.getElementById("revenueCount").textContent = 0;
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.date ? new Date(r.date).toLocaleDateString('ar-EG') : ''}</td>
        <td>${r.type || ''}</td>
        <td>${r.source || ''}</td>
        <td class="fw-bold text-success">${(+r.amount || 0).toLocaleString('ar-JO')}</td>
        <td>${r.notes || '—'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteRevenue(${r.id})"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `).join('');
    document.getElementById("revenueCount").textContent = data.length;
  } catch (e) {
    console.error('loadRevenue error:', e);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">فشل تحميل البيانات</td></tr>`;
  }
}

// حذف
async function deleteRevenue(id) {
  if (!confirm('هل أنت متأكد من الحذف؟')) return;
  await revenueAPI.delete(id); // DELETE /revenue/:id
  loadRevenue();
}

// حفظ من المودال
document.getElementById('addForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const payload = Object.fromEntries(new FormData(f).entries());

  // تطبيع الحقول المطلوبة للباك إند
  payload.amount = Number(payload.amount);
  payload.source = payload.source || 'غير محدد';
  if (!payload.date || !Number.isFinite(payload.amount)) {
    alert('التاريخ والمبلغ مطلوبان');
    return;
  }

  // POST /revenue
  await revenueAPI.create({
    date: payload.date,
    source: payload.source,
    amount: payload.amount,
    notes: payload.notes || ''
    // النوع حالياً يثبت في الباك إند كـ 'water_sale' (يمكن تعديله لاحقاً) :contentReference[oaicite:7]{index=7}
  });

  f.reset();
  document.querySelector('#addModal .btn-close')?.click();
  loadRevenue();
});

// تشغيل أولي
document.addEventListener('DOMContentLoaded', loadRevenue);
