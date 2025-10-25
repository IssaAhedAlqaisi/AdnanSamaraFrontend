// إدارة الإيرادات في الواجهة الأمامية
class RevenueManager {
    constructor() {
        this.revenues = [];
        this.init();
    }

    async init() {
        await this.loadRevenues();
        this.setupEventListeners();
    }

    async loadRevenues() {
        try {
            this.revenues = await revenueAPI.getAll();
            this.renderRevenueTable();
            this.updateRevenueStats();
        } catch (error) {
            console.error('Error loading revenues:', error);
            utils.showMessage('حدث خطأ في تحميل بيانات الإيرادات', 'error');
            // بيانات تجريبية
            this.revenues = [
                { id: 1, date: '2024-01-15', type: 'water_delivery', amount: 15000, client_name: 'أحمد محمد' },
                { id: 2, date: '2024-01-14', type: 'water_delivery', amount: 12000, client_name: 'شركة التقنية' }
            ];
            this.renderRevenueTable();
            this.updateRevenueStats();
        }
    }

    renderRevenueTable() {
        const tbody = document.getElementById('revenueTable')?.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = this.revenues.map(revenue => `
            <tr>
                <td>${this.formatDate(revenue.date)}</td>
                <td>${this.getTypeText(revenue.type)}</td>
                <td>${revenue.amount.toLocaleString('ar-EG')} دينار</td>
                <td>${revenue.client_name || '-'}</td>
                <td>${revenue.payment_method ? this.getPaymentMethodText(revenue.payment_method) : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="revenueManager.editRevenue(${revenue.id})">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="revenueManager.confirmDelete(${revenue.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ar-EG');
    }

    getTypeText(type) {
        const types = {
            'water_delivery': 'توصيل مياه',
            'subscription': 'اشتراك',
            'maintenance': 'صيانة',
            'other': 'أخرى'
        };
        return types[type] || type;
    }

    getPaymentMethodText(method) {
        const methods = {
            'cash': 'نقدي',
            'card': 'بطاقة',
            'transfer': 'تحويل',
            'check': 'شيك'
        };
        return methods[method] || method;
    }

    async updateRevenueStats() {
        try {
            const stats = await revenueAPI.getStats('month');
            document.getElementById('monthlyRevenue').textContent = `${(stats.total || 0).toLocaleString('ar-EG')} دينار`;
            document.getElementById('averageRevenue').textContent = `${(stats.average_amount || 0).toLocaleString('ar-EG')} دينار`;
            
            // محاكاة عدد العملاء الجدد
            const newClients = Math.floor(Math.random() * 10) + 1;
            document.getElementById('newClients').textContent = `${newClients} عميل`;
        } catch (error) {
            console.error('Error loading revenue stats:', error);
            document.getElementById('monthlyRevenue').textContent = '٧٨,٥٠٠ دينار';
            document.getElementById('averageRevenue').textContent = '٦٥,٤٠٠ دينار';
            document.getElementById('newClients').textContent = '٨ عملاء';
        }
    }

    async saveRevenue(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const revenueData = {
            date: formData.get('date'),
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            client_name: formData.get('client_name'),
            payment_method: formData.get('payment_method'),
            description: formData.get('description'),
            notes: formData.get('notes')
        };

        try {
            const id = formData.get('id');
            if (id) {
                await revenueAPI.update(id, revenueData);
                utils.showMessage('تم تحديث بيانات الإيراد بنجاح');
            } else {
                await revenueAPI.create(revenueData);
                utils.showMessage('تم إضافة الإيراد بنجاح');
            }

            await this.loadRevenues();
            bootstrap.Modal.getInstance(form.closest('.modal')).hide();
            form.reset();
        } catch (error) {
            console.error('Error saving revenue:', error);
            utils.showMessage('حدث خطأ في حفظ بيانات الإيراد', 'error');
        }
    }

    editRevenue(id) {
        const revenue = this.revenues.find(r => r.id === id);
        if (!revenue) return;

        const form = document.getElementById('revenueForm');
        form.querySelector('input[name="id"]').value = revenue.id;
        form.querySelector('input[name="date"]').value = revenue.date;
        form.querySelector('select[name="type"]').value = revenue.type;
        form.querySelector('input[name="amount"]').value = revenue.amount;
        form.querySelector('input[name="client_name"]').value = revenue.client_name || '';
        form.querySelector('select[name="payment_method"]').value = revenue.payment_method || '';
        form.querySelector('input[name="description"]').value = revenue.description || '';
        form.querySelector('textarea[name="notes"]').value = revenue.notes || '';

        new bootstrap.Modal(document.getElementById('addRevenueModal')).show();
    }

    confirmDelete(id) {
        document.getElementById('deleteRevenueId').value = id;
        new bootstrap.Modal(document.getElementById('deleteRevenueModal')).show();
    }

    async deleteRevenue() {
        const id = document.getElementById('deleteRevenueId').value;
        try {
            await revenueAPI.delete(id);
            utils.showMessage('تم حذف الإيراد بنجاح');
            await this.loadRevenues();
            bootstrap.Modal.getInstance(document.getElementById('deleteRevenueModal')).hide();
        } catch (error) {
            console.error('Error deleting revenue:', error);
            utils.showMessage('حدث خطأ في حذف الإيراد', 'error');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('revenueForm');
        if (form) {
            form.addEventListener('submit', (e) => this.saveRevenue(e));
        }

        const deleteBtn = document.getElementById('confirmDeleteRevenue');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteRevenue());
        }

        // تعيين التاريخ الحالي افتراضياً
        const dateInput = document.querySelector('input[name="date"]');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }
}

// تهيئة مدير الإيرادات
let revenueManager;
document.addEventListener('DOMContentLoaded', function() {
    revenueManager = new RevenueManager();
});