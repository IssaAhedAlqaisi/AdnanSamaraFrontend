// تحديث الوقت الحي
function updateLiveTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    const timeString = now.toLocaleDateString('ar-EG', options);
    document.getElementById('liveTime').textContent = timeString;
}

// تحميل إحصائيات اللوحة الرئيسية
async function loadDashboardStats() {
    try {
        // جلب إحصائيات العملاء
        const clientsStats = await clientsAPI.getStats();
        // جلب إحصائيات الإيرادات
        const revenueStats = await revenueAPI.getStats('month');
        // جلب إحصائيات الموظفين
        const employeesStats = await employeesAPI.getStats();
        // جلب المركبات
        const vehicles = await vehiclesAPI.getAll();

        // تحديث الواجهة
        document.getElementById('totalRevenue').textContent = `${(revenueStats.total || 0).toLocaleString('ar-EG')} دينار`;
        document.getElementById('totalCustomers').textContent = `${clientsStats.total_clients || 0} عميل`;
        document.getElementById('activeVehicles').textContent = `${vehicles.filter(v => v.status === 'active').length} مركبة`;
        document.getElementById('pendingTasks').textContent = `${employeesStats.trial_employees || 0} مهمة`;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // استخدام بيانات افتراضية في حالة الخطأ
        document.getElementById('totalRevenue').textContent = '٧٨,٥٠٠ دينار';
        document.getElementById('totalCustomers').textContent = '١٤٨ عميل';
        document.getElementById('activeVehicles').textContent = '١٢ مركبة';
        document.getElementById('pendingTasks').textContent = '٧ مهمة';
    }
}

// إنشاء المخططات
function initializeCharts() {
    // مخطط الإيرادات
    const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
                datasets: [{
                    label: 'الإيرادات الشهرية',
                    data: [65000, 72000, 68000, 78500, 82000, 90000],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // مخطط العملاء
    const customersCtx = document.getElementById('customersChart')?.getContext('2d');
    if (customersCtx) {
        new Chart(customersCtx, {
            type: 'doughnut',
            data: {
                labels: ['عملاء عاديون', 'عملاء مميزون', 'عملاء مؤسسيون'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#4facfe', '#f093fb', '#43e97b']
                }]
            }
        });
    }
}

// إدارة الإشعارات
function setupNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationModal = new bootstrap.Modal(document.getElementById('notificationsModal'));
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            notificationModal.show();
        });
    }
}

// تهيئة الصفحة الرئيسية
document.addEventListener('DOMContentLoaded', function() {
    updateLiveTime();
    setInterval(updateLiveTime, 1000);
    
    loadDashboardStats();
    initializeCharts();
    setupNotifications();
});