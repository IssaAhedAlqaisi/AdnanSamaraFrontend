// js/accounting.js
// يعتمد على js/api.js (revenueAPI, expensesAPI)

(function () {
  // عناصر DOM
  const revenueRows = document.getElementById('revenueRows');
  const expensesRows = document.getElementById('expensesRows');

  const revFrom = document.getElementById('revFrom');
  const revTo   = document.getElementById('revTo');
  const expFrom = document.getElementById('expFrom');
  const expTo   = document.getElementById('expTo');

  // فلاتر إضافية حسب طلبك
  const revClientEl = document.getElementById('revClient'); // اسم العميل
  const revTypeEl   = document.getElementById('revType');   // النوع (كاش/ذمم/فيزا)

  const expOwnerEl  = document.getElementById('expOwner');  // اسم صاحب المصروف
  const expPayEl    = document.getElementById('expPay');    // طريقة الدفع

  const revTotalEl = document.getElementById('revTotal');
  const expTotalEl = document.getElementById('expTotal');

  const revTotalSummary = document.getElementById('revTotalSummary');
  const expTotalSummary = document.getElementById('expTotalSummary');
  const profitValue = document.getElementById('profitValue');
  const profitPercent = document.getElementById('profitPercent');

  const printRevenueBtn  = document.getElementById('printRevenueBtn');
  const printExpensesBtn = document.getElementById('printExpensesBtn');

  // بيانات خام
  let revenueAll = [];
  let expensesAll = [];

  // أدوات
  const toISO = d => (d ? new Date(d).toISOString().slice(0,10) : null);

  function inRange(dateStr, fromStr, toStr) {
    const d = toISO(dateStr);
    if (!d) return false;
    if (fromStr && d < fromStr) return false;
    if (toStr   && d > toStr)   return false;
    return true;
  }

  function number(n) {
    const x = Number(n);
    return isFinite(x) ? x : 0;
  }

  function sumAmounts(rows) {
    return rows.reduce((s, r) => s + number(r.amount || r.total || r.value), 0);
  }

  // ====== عرض الإيرادات: التاريخ | اسم العميل | النوع | المبلغ ======
  function renderRevenue(rows) {
    revenueRows.innerHTML = rows.length
      ? rows.map(r => {
          const client = r.driver_name || '-'; // نعرضه كـ "اسم العميل"
          const pay    = (r.payment_type ?? r.payment_method ?? '-');
          return `
            <tr>
              <td>${toISO(r.date) || '-'}</td>
              <td>${client}</td>
              <td>${pay}</td>
              <td>${number(r.amount).toFixed(2)}</td>
            </tr>
          `;
        }).join('')
      : `<tr><td colspan="4" class="text-muted">لا توجد بيانات</td></tr>`;

    const total = sumAmounts(rows);
    revTotalEl.textContent = total.toFixed(2);
    revTotalSummary.textContent = total.toFixed(2);
    updateProfit();
  }

  // ====== عرض المصاريف: التاريخ | النوع | اسم صاحب المصروف | طريقة الدفع | المبلغ ======
  function renderExpenses(rows) {
    expensesRows.innerHTML = rows.length
      ? rows.map(r => `
          <tr>
            <td>${toISO(r.date) || '-'}</td>
            <td>${r.type_name || r.type || '-'}</td>
            <td>${r.beneficiary || '-'}</td>
            <td>${r.pay_method || '-'}</td>
            <td>${number(r.amount).toFixed(2)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" class="text-muted">لا توجد بيانات</td></tr>`;

    const total = sumAmounts(rows);
    expTotalEl.textContent = total.toFixed(2);
    expTotalSummary.textContent = total.toFixed(2);
    updateProfit();
  }

  function updateProfit() {
    const rev = number(revTotalSummary.textContent);
    const exp = number(expTotalSummary.textContent);
    const profit = rev - exp;
    const pct = rev > 0 ? (profit / rev) * 100 : 0;
    profitValue.textContent = profit.toFixed(2);
    profitPercent.textContent = `${pct.toFixed(2)}%`;
  }

  // ====== فلترة الإيرادات ======
  function applyRevenueFilter() {
    const f = revFrom.value || null;
    const t = revTo.value || null;
    const name = (revClientEl?.value || '').trim();          // اسم العميل
    const ptype = (revTypeEl?.value || '').trim().toLowerCase(); // النوع

    const filtered = revenueAll.filter(r => {
      if (!inRange(r.date, f, t)) return false;

      if (name) {
        const client = (r.driver_name || '').toString();
        if (!client.includes(name)) return false;
      }

      if (ptype) {
        const pay = (r.payment_type ?? r.payment_method ?? '').toString().toLowerCase();
        if (pay !== ptype) return false;
      }

      return true;
    });

    renderRevenue(filtered);
  }

  // ====== فلترة المصاريف ======
  function applyExpensesFilter() {
    const f = expFrom.value || null;
    const t = expTo.value || null;
    const owner = (expOwnerEl?.value || '').trim();            // صاحب المصروف
    const paym  = (expPayEl?.value || '').trim().toLowerCase();// طريقة الدفع

    const filtered = expensesAll.filter(r => {
      if (!inRange(r.date, f, t)) return false;

      if (owner) {
        const ben = (r.beneficiary || '').toString();
        if (!ben.includes(owner)) return false;
      }

      if (paym) {
        const pm = (r.pay_method || '').toString().toLowerCase();
        if (pm !== paym) return false;
      }

      return true;
    });

    renderExpenses(filtered);
  }

  // طباعة جدول
  function printTable(tableId, title) {
    const table = document.getElementById(tableId);
    const w = window.open('', '_blank');
    w.document.write(`
      <html dir="rtl" lang="ar"><head>
        <meta charset="utf-8">
        <title>${title}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
        <style>body{padding:20px;font-family:Cairo, sans-serif} th,td{text-align:center}</style>
      </head><body>
        <h4 class="mb-3">${title}</h4>
        ${table.outerHTML}
        <script>window.onload=function(){window.print();window.onfocus=function(){setTimeout(()=>window.close(),250);}}<\/script>
      </body></html>
    `);
    w.document.close();
  }

  // أحداث
  document.getElementById('filterRevenueBtn').addEventListener('click', applyRevenueFilter);
  document.getElementById('filterExpensesBtn').addEventListener('click', applyExpensesFilter);
  printRevenueBtn.addEventListener('click', () => printTable('revenueTable', 'جدول الإيرادات'));
  printExpensesBtn.addEventListener('click', () => printTable('expensesTable', 'جدول المصاريف'));

  // تحميل أوّلي
  (async function init() {
    try {
      // إيرادات
      const rev = await revenueAPI.getAll();
      revenueAll = Array.isArray(rev) ? rev : [];
      renderRevenue(revenueAll);

      // مصاريف
      const exp = await expensesAPI.getAll();
      expensesAll = (Array.isArray(exp) ? exp : []).map(e => ({
        ...e,
        type_name: e.type_name || e.type || ''
      }));
      renderExpenses(expensesAll);
    } catch (err) {
      console.error('Load error:', err);
      revenueRows.innerHTML  = `<tr><td colspan="4" class="text-danger">فشل تحميل الإيرادات</td></tr>`;
      expensesRows.innerHTML = `<tr><td colspan="5" class="text-danger">فشل تحميل المصاريف</td></tr>`;
    }
  })();
})();
