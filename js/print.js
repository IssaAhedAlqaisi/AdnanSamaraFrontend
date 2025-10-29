// frontend/js/print.js
function printTable(tableId, title = "") {
  const table = document.getElementById(tableId);
  if (!table) {
    alert("لم يتم العثور على الجدول المطلوب");
    return;
  }

  const win = window.open("", "_blank");
  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${title || document.title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet" />
<style>
  body { font-family: "Cairo", system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 16px; }
  h3 { margin-bottom: 16px; }
  table { width: 100%; }
  th, td { text-align: center; vertical-align: middle; }
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <div class="d-flex justify-content-between align-items-center no-print mb-3">
    <h3 class="m-0">${title || "طباعة الجدول"}</h3>
    <button class="btn btn-primary" onclick="window.print()">طباعة</button>
  </div>
  <div class="table-responsive">
    ${table.outerHTML}
  </div>
  <script>
    // طباعة تلقائية بعد فتح النافذة (اختياري)
    setTimeout(() => window.print(), 200);
  </script>
</body>
</html>`;
  win.document.write(html);
  win.document.close();
}
