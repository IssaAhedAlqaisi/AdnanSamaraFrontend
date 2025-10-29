// frontend/js/revenue-frontend.js

// تأكد أن api.js محمّل وفيه API_BASE_URL = 'https://adnansamarabackend-1.onrender.com/api'
// وفيه كائن api {get, post, delete...}

document.addEventListener("DOMContentLoaded", () => {
  loadRevenue();

  // إضافة إيراد
  const form = document.getElementById("revForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        amount: Number(document.getElementById("amount").value || 0),
        payment_type: document.getElementById("payment_type").value,
        tank_type: document.getElementById("tank_type").value,
        water_amount: document.getElementById("water_amount").value,
        source_type: document.getElementById("source_type").value,
        driver_name: document.getElementById("driver_name").value,
        vehicle_number: document.getElementById("vehicle_number").value,
        notes: document.getElementById("notes").value
      };

      try {
        const res = await api.post("/revenue", payload);
        // أغلق المودال وجدّد الجدول
        const closeBtn = document.querySelector('#addModal .btn-close');
        if (closeBtn) closeBtn.click();
        form.reset();
        await loadRevenue();
      } catch (err) {
        console.error("❌ إضافة الإيراد فشلت:", err);
        alert("حدث خطأ أثناء إضافة الإيراد");
      }
    });
  }
});

async function loadRevenue() {
  const tb = document.getElementById("rows");
  if (!tb) return;

  try {
    const list = await api.get("/revenue");
    if (!list.length) {
      tb.innerHTML = `<tr><td colspan="8" class="text-center text-muted">لا توجد بيانات</td></tr>`;
      const rc1 = document.getElementById("revCount");
      if (rc1) rc1.textContent = "0";
      return;
    }

    tb.innerHTML = list
      .map((r) => {
        return `
        <tr>
          <td>${r.date || "-"}</td>
          <td>${fmt(r.amount)}</td>
          <td>${r.payment_method || "-"}</td>
          <td>${r.tank_type || "-"}</td>
          <td>${extractAmount(r.description) || "-"}</td>
          <td>${r.source_type || "-"}</td>
          <td>${r.driver_name || "-"}</td>
          <td>${r.vehicle_number || "-"}</td>
        </tr>`;
      })
      .join("");

    const rc2 = document.getElementById("revCount");
    if (rc2) rc2.textContent = String(list.length);
  } catch (err) {
    console.error("❌ خطأ تحميل الإيرادات:", err);
    tb.innerHTML = `<tr><td colspan="8" class="text-danger text-center">فشل تحميل البيانات</td></tr>`;
  }
}


function fmt(v) {
  const n = Number(v || 0);
  return isNaN(n) ? "-" : n.toFixed(2);
}

function extractAmount(desc) {
  if (!desc) return "";
  // لو حفظنا "كمية المياه: 55" نستخرج الرقم
  const m = String(desc).match(/(\d+(\.\d+)?)/);
  return m ? m[1] : "";
}
