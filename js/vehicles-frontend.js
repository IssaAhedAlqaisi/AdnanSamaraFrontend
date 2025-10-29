/* frontend/js/vehicles-frontend.js */

document.addEventListener("DOMContentLoaded", () => {
  loadVehicles();
  populateDrivers();
  loadVehicleLogs();

  // ➕ إضافة مركبة جديدة
  const addForm = document.getElementById("addForm");
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const payload = {
        number: (f.plate?.value || "").trim(),
        driver_name: (f.driver?.value || "").trim(),
        current_location: (f.location?.value || "").trim(),
        capacity: "",
        model: "",
        status: f.status?.value || "active",
      };
      if (!payload.number || !payload.driver_name) return;

      try {
        disableBtn(f.querySelector("button[type=submit]"), true);
        await api.post("/vehicles", payload);
        f.reset();
        closeModalSafely("#addModal");
        await Promise.all([loadVehicles(), populateDrivers()]);
      } catch (err) {
        console.error("Add vehicle error:", err);
        toast("تعذر إضافة المركبة", "danger");
      } finally {
        disableBtn(f.querySelector("button[type=submit]"), false);
      }
    });
  }

  // 🧾 إضافة سجل عداد يومي
  const logForm = document.getElementById("vehicleLogForm");
  if (logForm) {
    logForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;

      const driver_name = (f.driverSelect?.value || "").trim();
      const vehicle_number = (f.vehicleNumber?.value || "").trim();
      const odometer_start = num(f.odometer_start?.value);
      const odometer_end = num(f.odometer_end?.value);

      if (!driver_name || !vehicle_number) {
        // ما منعمل alert — بس منسجل تحذير وبنوقف
        console.warn("Missing driver/vehicle. Skipping submit.");
        return;
      }

      try {
        disableBtn(f.querySelector("button[type=submit]"), true);
        await api.post("/vehicles/logs", {
          driver_name,
          vehicle_number,
          odometer_start,
          odometer_end,
        });
        f.reset();
        closeModalSafely("#addLogModal");
        await loadVehicleLogs(); // رح تضل بعد الريفريش لأنها صارت محفوظة DB
      } catch (err) {
        console.error("Add log error:", err);
        toast("تعذر إضافة السجل", "danger");
      } finally {
        disableBtn(f.querySelector("button[type=submit]"), false);
      }
    });
  }
});

/* ============ Helpers ============ */
function disableBtn(btn, state) {
  if (!btn) return;
  btn.disabled = !!state;
  btn.dataset._old = btn.innerHTML;
  btn.innerHTML = state ? `<span class="spinner-border spinner-border-sm"></span>` : btn.dataset._old;
}
function closeModalSafely(sel) {
  const close = document.querySelector(`${sel} .btn-close`);
  if (close) close.click();
}
function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
function shortDate(d) {
  // يدعم DATE من السيرفر أو نص ISO
  if (!d) return "";
  const s = String(d);
  if (s.includes("T")) return s.split("T")[0];
  return s;
}
function toast(msg, type = "primary") {
  console.log(`[${type}] ${msg}`);
}

/* ============ Vehicles ============ */
async function loadVehicles() {
  const tb = document.getElementById("rows");
  if (!tb) return;
  // عرض "جارِ التحميل" فقط
  tb.innerHTML = `<tr><td colspan="5" class="text-muted">... جارِ التحميل</td></tr>`;
  try {
    const list = await api.get("/vehicles");
    if (!Array.isArray(list) || list.length === 0) {
      tb.innerHTML = `<tr><td colspan="5" class="text-muted">لا توجد مركبات</td></tr>`;
    } else {
      tb.innerHTML = list
        .map(
          (v) => `
          <tr>
            <td>${esc(v.number)}</td>
            <td>${esc(v.driver_name)}</td>
            <td>${esc(v.current_location) || "-"}</td>
            <td>${esc(v.status) || "-"}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="delVehicle(${v.id})">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>`
        )
        .join("");
    }
    const cnt = document.getElementById("vehicleCount");
    if (cnt) cnt.textContent = list?.length ?? 0;
  } catch (err) {
    console.error("Load vehicles error:", err);
    tb.innerHTML = `<tr><td colspan="5" class="text-danger">حدث خطأ أثناء التحميل</td></tr>`;
  }
}

async function delVehicle(id) {
  if (!confirm("هل أنت متأكد من حذف هذه المركبة؟")) return;
  try {
    await api.delete("/vehicles/" + id);
    await Promise.all([loadVehicles(), populateDrivers()]);
  } catch (err) {
    console.error("Delete vehicle error:", err);
    toast("تعذر حذف المركبة", "danger");
  }
}

/* ============ Logs ============ */
async function loadVehicleLogs() {
  const tbody = document.querySelector("#vehicleLogsTable tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="text-muted">... جارِ التحميل</td></tr>`;
  try {
    const logs = await api.get("/vehicles/logs");
    if (!Array.isArray(logs) || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted">لا توجد سجلات</td></tr>`;
      return;
    }
    tbody.innerHTML = logs
      .map(
        (l) => `
        <tr>
          <td>${esc(shortDate(l.date))}</td>
          <td>${esc(l.driver_name)}</td>
          <td>${esc(l.vehicle_number)}</td>
          <td>${l.odometer_start ?? "-"}</td>
          <td>${l.odometer_end ?? "-"}</td>
          <td>${typeof l.distance === "number" ? l.distance.toFixed(2) : "-"}</td>
        </tr>`
      )
      .join("");
  } catch (err) {
    console.error("Load logs error:", err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger">حدث خطأ أثناء تحميل السجلات</td></tr>`;
  }
}

/* ============ Drivers dropdown ============ */
async function populateDrivers() {
  const select = document.getElementById("driverSelect");
  const numberInput = document.getElementById("vehicleNumber");
  if (!select) return;

  try {
    const vehicles = await api.get("/vehicles");
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      select.innerHTML = `<option value="">لا يوجد سائقون</option>`;
      if (numberInput) numberInput.value = "";
      return;
    }
    select.innerHTML = vehicles
      .map(
        (v) => `<option value="${esc(v.driver_name)}" data-number="${esc(v.number)}">
                  ${esc(v.driver_name)}
                </option>`
      )
      .join("");

    select.addEventListener("change", (e) => {
      const opt = e.target.selectedOptions?.[0];
      if (numberInput) numberInput.value = opt?.dataset?.number || "";
    });

    // اضبط رقم المركبة لأول عنصر
    const first = select.options?.[0];
    if (first && numberInput) numberInput.value = first.dataset.number || "";
  } catch (err) {
    console.error("Populate drivers error:", err);
  }
}

/* ============ utils ============ */
function esc(v) {
  return (v ?? "").toString().replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
}
