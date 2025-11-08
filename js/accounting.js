<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>قسم المحاسبة | شركة عدنان سماره</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet"/>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet"/>

  <style>
    body{font-family:"Cairo",sans-serif;background:#f7f9fc}
    /* Sidebar مختصر (نفس ستايل بقية الصفحات) */
    #sidebar-wrapper{width:250px;position:fixed;right:0;top:0;bottom:0;background:linear-gradient(180deg,#2563eb,#1d4ed8);color:#fff;overflow-y:auto}
    #page-content-wrapper{margin-right:250px}
    .list-group-item{background:transparent;color:#e0e7ff;border:none}
    .list-group-item.active,.list-group-item:hover{background-color:rgba(255,255,255,.2);color:#fff}
    thead.table-primary{background:linear-gradient(90deg,#2563eb,#1d4ed8);color:#fff}
    .summary-badge{border-radius:12px;padding:14px 18px}
  </style>
</head>
<body>

  <!-- Sidebar -->
  <div id="sidebar-wrapper">
    <div class="text-center py-4">
      <img src="images/logo.png" width="80" class="mb-2" alt="logo">
      <h5 class="fw-bold">شركة عدنان سماره</h5>
      <p class="mb-0 small">لنقل المياه</p>
    </div>
    <div class="list-group list-group-flush">
      <a class="list-group-item" href="index.html"><i class="fa-solid fa-house me-2"></i> الشاشة الرئيسة</a>
      <a class="list-group-item" href="revenue.html"><i class="fa-solid fa-sack-dollar me-2"></i> الإيرادات</a>
      <a class="list-group-item" href="expenses.html"><i class="fa-solid fa-money-bill-wave me-2"></i> المصاريف</a>
      <a class="list-group-item" href="employees.html"><i class="fa-solid fa-users me-2"></i> الموظفون</a>
      <a class="list-group-item" href="vehicles.html"><i class="fa-solid fa-truck-droplet me-2"></i> المركبات</a>
      <a class="list-group-item" href="suppliers.html"><i class="fa-solid fa-truck-field me-2"></i> الموردون</a>
      <a class="list-group-item" href="customers.html"><i class="fa-solid fa-user-tie me-2"></i> العملاء</a>
      <a class="list-group-item active" href="accounting.html"><i class="fa-solid fa-scale-balanced me-2"></i> قسم المحاسبة</a>
      <a class="list-group-item" href="settings.html"><i class="fa-solid fa-gear me-2"></i> الإعدادات</a>
    </div>
  </div>

  <!-- Content -->
  <div id="page-content-wrapper">
    <nav class="navbar bg-white shadow-sm">
      <div class="container-fluid">
        <span class="navbar-brand fw-bold text-primary"><i class="fa-solid fa-scale-balanced me-2"></i> قسم المحاسبة</span>
      </div>
    </nav>

    <div class="container-fluid py-4">

      <div class="row g-4">
        <!-- ====== جدول الإيرادات ====== -->
        <div class="col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="fw-bold"><i class="fa-solid fa-sack-dollar me-2"></i> جدول الإيرادات</span>
              <button class="btn btn-sm btn-secondary" onclick="printTable('revTable')"><i class="fa-solid fa-print"></i> طباعة الجدول</button>
            </div>
            <div class="card-body">
              <!-- فلاتر الإيرادات -->
              <div class="row g-2 align-items-end mb-3">
                <div class="col-6 col-md-4">
                  <label class="form-label mb-1">من تاريخ</label>
                  <input type="date" id="revFrom" class="form-control form-control-sm">
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label mb-1">إلى تاريخ</label>
                  <input type="date" id="revTo" class="form-control form-control-sm">
                </div>
                <div class="col-md-4">
                  <label class="form-label mb-1">اسم العميل</label>
                  <input id="revClient" class="form-control form-control-sm" placeholder="اكتب الاسم">
                </div>
                <div class="col-md-4">
                  <label class="form-label mb-1">النوع</label>
                  <select id="revPay" class="form-select form-select-sm">
                    <option value="">الكل</option>
                    <option>كاش</option><option>ذمم</option><option>فيزا</option>
                    <option>cash</option><option>visa</option><option>credit</option>
                  </select>
                </div>
                <div class="col-md-8 text-end">
                  <button class="btn btn-primary btn-sm" id="revApply"><i class="fa-solid fa-filter"></i> تطبيق الفلترة</button>
                  <button class="btn btn-outline-secondary btn-sm" id="revClear">إلغاء الفلترة</button>
                </div>
              </div>

              <div class="table-responsive">
                <table id="revTable" class="table table-hover text-center align-middle">
                  <thead class="table-primary">
                    <tr>
                      <th>التاريخ</th>
                      <th>اسم العميل</th>
                      <th>النوع</th>
                      <th>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody id="revRows">
                    <tr><td colspan="4" class="text-muted">جارٍ التحميل…</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="alert alert-success py-2 mb-0">
                إجمالي الإيرادات (المفلترة): <b id="revTotal">0.00</b>
              </div>
            </div>
          </div>
        </div>

        <!-- ====== جدول المصاريف ====== -->
        <div class="col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="fw-bold"><i class="fa-solid fa-wallet me-2"></i> جدول المصاريف</span>
              <button class="btn btn-sm btn-secondary" onclick="printTable('expTable')"><i class="fa-solid fa-print"></i> طباعة الجدول</button>
            </div>
            <div class="card-body">
              <!-- فلاتر المصاريف -->
              <div class="row g-2 align-items-end mb-3">
                <div class="col-6 col-md-4">
                  <label class="form-label mb-1">من تاريخ</label>
                  <input type="date" id="expFrom" class="form-control form-control-sm">
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label mb-1">إلى تاريخ</label>
                  <input type="date" id="expTo" class="form-control form-control-sm">
                </div>
                <div class="col-md-4">
                  <label class="form-label mb-1">اسم صاحب المصروف</label>
                  <input id="expOwner" class="form-control form-control-sm" placeholder="اكتب الاسم">
                </div>
                <div class="col-md-4">
                  <label class="form-label mb-1">طريقة الدفع</label>
                  <select id="expPay" class="form-select form-select-sm">
                    <option value="">الكل</option>
                    <option>كاش</option><option>ذمم</option><option>فيزا</option>
                    <option>cash</option><option>visa</option><option>credit</option>
                  </select>
                </div>
                <div class="col-md-8 text-end">
                  <button class="btn btn-primary btn-sm" id="expApply"><i class="fa-solid fa-filter"></i> تطبيق الفلترة</button>
                  <button class="btn btn-outline-secondary btn-sm" id="expClear">إلغاء الفلترة</button>
                </div>
              </div>

              <div class="table-responsive">
                <table id="expTable" class="table table-hover text-center align-middle">
                  <thead class="table-primary">
                    <tr>
                      <th>التاريخ</th>
                      <th>النوع</th>
                      <th>اسم صاحب المصروف</th>
                      <th>طريقة الدفع</th>
                      <th>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody id="expRows">
                    <tr><td colspan="5" class="text-muted">جارٍ التحميل…</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="alert alert-danger py-2 mb-0">
                إجمالي المصاريف (المفلترة): <b id="expTotal">0.00</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ====== الملخص ====== -->
      <div class="row g-3 mt-4">
        <div class="col-lg-4">
          <div class="bg-success text-white summary-badge">
            إجمالي الإيرادات (المفلترة): <b id="sumRev">0.00</b>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="bg-danger text-white summary-badge">
            إجمالي المصاريف (المفلترة): <b id="sumExp">0.00</b>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="bg-secondary text-white summary-badge d-flex justify-content-between">
            <span>الربح الصافي:</span>
            <span><b id="netProfit">0.00</b> — نسبة الربح: <b id="profitPct">0%</b></span>
          </div>
        </div>
      </div>

    </div>
  </div>

  <script src="js/api.js"></script>
  <script src="js/accounting-frontend.js"></script>
</body>
</html>
