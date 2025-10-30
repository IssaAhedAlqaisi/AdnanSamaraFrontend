// frontend/js/sidebar-toggle.js
(function () {
  // عناصر مع احتمالات أسماء مختلفة
  const sidebar =
    document.getElementById("sidebar-wrapper") ||
    document.querySelector("#sidebar-wrapper") ||
    document.querySelector(".sidebar") ||
    document.querySelector(".side-nav");

  // عنصر يلف المحتوى (لو موجود) حتى نرجّع المسافات لما نغلق الشريط
  const content =
    document.querySelector(".content-wrapper") ||
    document.querySelector("#content-wrapper") ||
    document.querySelector("main") ||
    document.body;

  if (!sidebar) return; // ما في سايدبار؟ ولا يهمك

  // أبعاد الشريط (لو عندك عرض آخر غير 260px عدّله)
  const SIDEBAR_WIDTH = sidebar.offsetWidth || 260;

  // حقن CSS بسيط للحالة المغلقة
  const style = document.createElement("style");
  style.textContent = `
    #sidebar-wrapper {
      transition: transform .25s ease, right .25s ease;
      will-change: transform;
    }
    body.sidebar-closed #sidebar-wrapper {
      transform: translateX(${SIDEBAR_WIDTH}px); /* يدفع الشريط لليسار (هو على اليمين) */
    }
    /* رجّع مسافة المحتوى إذا كنت عامل margin-right للمحتوى */
    body.sidebar-closed .content-wrapper,
    body.sidebar-closed #content-wrapper {
      margin-right: 0 !important;
    }

    /* الزر العائم */
    .sidebar-toggle-btn{
      position: fixed;
      right: 14px;
      bottom: 18px;
      z-index: 1100;
      width: 44px;
      height: 44px;
      border-radius: 999px;
      border: none;
      background: #0ea5e9; /* سماوي حلو */
      color: #fff;
      box-shadow: 0 6px 18px rgba(0,0,0,.18);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .sidebar-toggle-btn:active{ transform: scale(.98); }
  `;
  document.head.appendChild(style);

  // أنشئ الزر (أيقونة ≡)
  const btn = document.createElement("button");
  btn.className = "sidebar-toggle-btn";
  btn.setAttribute("aria-label", "إظهار/إخفاء القائمة");
  btn.innerHTML = "≡";
  document.body.appendChild(btn);

  // استرجاع الحالة المحفوظة
  const saved = localStorage.getItem("sidebarClosed");
  if (saved === "1") document.body.classList.add("sidebar-closed");

  // وظيفة التبديل
  function toggleSidebar() {
    document.body.classList.toggle("sidebar-closed");
    const closed = document.body.classList.contains("sidebar-closed");
    localStorage.setItem("sidebarClosed", closed ? "1" : "0");
  }

  btn.addEventListener("click", toggleSidebar);

  // اختصار لوحة مفاتيح (Ctrl + B) للي بحب الشطارة :)
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      toggleSidebar();
    }
  });
})();
