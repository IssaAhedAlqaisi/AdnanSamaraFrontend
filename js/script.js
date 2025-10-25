/* =========================
   حماية الدخول للنظام
   ========================= */
// ✅ منع الدخول بدون تسجيل
if (!localStorage.getItem("loggedIn")) {
  if (!window.location.href.includes("login.html")) {
    window.location.href = "login.html";
  }
}

/* =========================
   تفاعل الواجهة – Dashboard
   ========================= */
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ====== Sidebar toggle ====== */
  const sidebar = $("#sidebar-wrapper");
  const toggleBtn = $("#menu-toggle");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  /* ====== Inject الساعة + الإشعارات ====== */
  const nav = $(".navbar .container-fluid");
  if (nav && !$(".topbar-tools", nav)) {
    const tools = document.createElement("div");
    tools.className = "topbar-tools position-relative";
    tools.innerHTML = `
      <button class="notif-btn" id="notif-btn" aria-label="Notifications">
        <i class="fa-regular fa-bell fa-lg"></i>
        <span class="badge-dot" id="notif-dot"></span>
      </button>
      <div class="clock" id="clock"></div>
      <div class="notif-panel" id="notif-panel" dir="rtl">
        <div class="d-flex align-items-center justify-content-between px-2 pb-1">
          <strong>الإشعارات</strong>
          <button class="btn btn-sm btn-link text-decoration-none" id="notif-clear">مسح الكل</button>
        </div>
        <div class="hr"></div>
        <div id="notif-list"></div>
      </div>
    `;
    nav.appendChild(tools);
  }

  /* ====== ساعة حية ====== */
  const clockEl = $("#clock");
  function tickClock() {
    if (!clockEl) return;
    const now = new Date();
    const d = now.toLocaleDateString("ar-JO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const t = now.toLocaleTimeString("ar-JO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    clockEl.textContent = `${t} — ${d}`;
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ====== إشعارات بسيطة ====== */
  const notifBtn = $("#notif-btn");
  const notifPanel = $("#notif-panel");
  const notifDot = $("#notif-dot");
  const notifList = $("#notif-list");
  const notifClear = $("#notif-clear");

  function renderNotif(items) {
    if (!notifList) return;
    notifList.innerHTML = items.length
      ? items
          .map(
            (n) => `
          <div class="notif-item d-flex align-items-start gap-2 py-2 px-2 border-bottom">
            <i class="${n.icon || "fa-solid fa-circle-info"} text-primary"></i>
            <div>
              <div>${n.text}</div>
              <div class="notif-time small text-muted">${n.time}</div>
            </div>
          </div>`
          )
          .join("")
      : `<div class="text-center muted p-3">لا توجد إشعارات</div>`;
  }

  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw 0;
      const data = await res.json();
      renderNotif(data || []);
      notifDot.classList.toggle("hidden", !(data && data.length));
    } catch (e) {
      const demo = [
        {
          text: "تمت إضافة مصروف جديد (وقود) - 120 دينار",
          time: "قبل لحظات",
          icon: "fa-solid fa-gas-pump",
        },
        {
          text: "إيراد جديد: مستشفى الزرقاء - 850 دينار",
          time: "قبل 15 دقيقة",
          icon: "fa-solid fa-sack-dollar",
        },
        {
          text: "تذكير صيانة مركبة J-1987",
          time: "اليوم 10:30 ص",
          icon: "fa-solid fa-screwdriver-wrench",
        },
      ];
      renderNotif(demo);
      notifDot.classList.remove("hidden");
    }
  }
  loadNotifications();

  if (notifBtn && notifPanel) {
    notifBtn.addEventListener("click", () =>
      notifPanel.classList.toggle("show")
    );
    document.addEventListener("click", (e) => {
      if (!notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
        notifPanel.classList.remove("show");
      }
    });
  }
  if (notifClear) {
    notifClear.addEventListener("click", () => {
      renderNotif([]);
      notifDot.classList.add("hidden");
    });
  }

  /* ====== أدوات API موحدة ====== */
  window.Api = {
    base: "https://adnansamarabackend-1.onrender.com", // ✅ رابط السيرفر على Render

    async get(endpoint) {
      const url = this.base + endpoint;
      console.log("📡 GET:", url);
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) {
          console.error("❌ GET error:", res.status, res.statusText);
          return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : data ? [data] : [];
      } catch (err) {
        console.error("❌ GET request failed:", err);
        return [];
      }
    },

    async post(endpoint, payload) {
      const url = this.base + endpoint;
      console.log("📡 POST:", url);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      } catch (err) {
        console.error("❌ POST error:", err);
        return { error: err.message };
      }
    },

    async put(endpoint, payload) {
      const url = this.base + endpoint;
      try {
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      } catch (err) {
        console.error("❌ PUT error:", err);
        return { error: err.message };
      }
    },

    async del(endpoint) {
      const url = this.base + endpoint;
      try {
        const res = await fetch(url, { method: "DELETE" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      } catch (err) {
        console.error("❌ DELETE error:", err);
        return { error: err.message };
      }
    },
  };

  /* ====== أنيميشن لطيف ====== */
  const fadeables = $$(".feature-card, .table, .card");
  fadeables.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    setTimeout(() => {
      el.style.transition = "opacity .5s ease, transform .5s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 140 + i * 80);
  });

  /* ====== تمييز الرابط النشط ====== */
  const path = location.pathname.split("/").pop() || "index.html";
  $$("#sidebar-wrapper .list-group-item").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path) {
      a.classList.add("active");
    } else {
      a.classList.remove("active");
    }
  });
})();
