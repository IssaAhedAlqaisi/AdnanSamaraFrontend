// إدارة المصاريف في الواجهة الأمامية
class ExpensesManager {
    constructor() {
        this.expenses = [];
        this.init();
    }

    async init() {
        await this.loadExpenses();
        this.setupEventListeners();
    }

    async loadExpenses() {
        try {
            this.expenses = await expensesAPI.getAll();
            this.renderExpensesTable();
            this.updateExpensesStats();
        } catch (error) {
            console.error('Error loading expenses:', error);
            utils.showMessage('حدث خطأ في تحميل بيانات المصاريف', 'error');
            // بيانات تجريبية
            this.expenses = [
                { id: 1, date: '2024-01-15', category: 'fuel', amount: 4500, description: 'تعبئة وقود' },
                { id: 2, date: '2024-01-14', category: 'maintenance', amount: 1200, description: 'صيانة مركبة' }
            ];
            this.renderExpensesTable();
            this.updateExpensesStats();
        }
    }

    renderExpensesTable() {
        const tbody = document.getElementById('expensesTable')?.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = this.expenses.map(expense => `
            <tr>
                <td>${this.formatDate(expense.date)}</td>
                <td>${this.getCategoryText(expense.category)}</td>
                <td>${expense.amount.toLocaleString('ar-EG')} دينار</td>
                <td>${expense.description || '-'}</td>
                <td>${expense.supplier_name || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="expensesManager.editExpense(${expense.id})">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="expensesManager.confirmDelete(${expense.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ar-EG');
    }

    getCategoryText(category) {
        const categories = {
            'fuel': 'وقود',
            'maintenance': 'صيانة',
            'salaries': 'رواتب',
            'utilities': 'مرافق',
            'supplies': 'لوازم',
            'other': 'أخرى'
        };
        return categories[category] || category;
    }

    updateExpensesStats() {
        const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const fuelExpenses = this.expenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.amount, 0);
        const maintenanceExpenses = this.expenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0);

        document.getElementById('totalExpenses').textContent = `${totalExpenses.toLocaleString('ar-EG')} دينار`;
        document.getElementById('fuelExpenses').textContent = `${fuelExpenses.toLocaleString('ar-EG')} دينار`;
        document.getElementById('maintenanceExpenses').textContent = `${maintenanceExpenses.toLocaleString('ar-EG')} دينار`;
    }

    async saveExpense(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const expenseData = {
            date: formData.get('date'),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description'),
            supplier_name: formData.get('supplier_name'),
            notes: formData.get('notes')
        };

        try {
            const id = formData.get('id');
            if (id) {
                await expensesAPI.update(id, expenseData);
                utils.showMessage('تم تحديث بيانات المصروف بنجاح');
            } else {
                await expensesAPI.create(expenseData);
                utils.showMessage('تم إضافة المصروف بنجاح');
            }

            await this.loadExpenses();
            bootstrap.Modal.getInstance(form.closest('.modal')).hide();
            form.reset();
        } catch (error) {
            console.error('Error saving expense:', error);
            utils.showMessage('حدث خطأ في حفظ بيانات المصروف', 'error');
        }
    }

    editExpense(id) {
        const expense = this.expenses.find(e => e.id === id);
        if (!expense) return;

        const form = document.getElementById('expenseForm');
        form.querySelector('input[name="id"]').value = expense.id;
        form.querySelector('input[name="date"]').value = expense.date;
        form.querySelector('select[name="category"]').value = expense.category;
        form.querySelector('input[name="amount"]').value = expense.amount;
        form.querySelector('input[name="description"]').value = expense.description || '';
        form.querySelector('input[name="supplier_name"]').value = expense.supplier_name || '';
        form.querySelector('textarea[name="notes"]').value = expense.notes || '';

        new bootstrap.Modal(document.getElementById('addExpenseModal')).show();
    }

    confirmDelete(id) {
        document.getElementById('deleteExpenseId').value = id;
        new bootstrap.Modal(document.getElementById('deleteExpenseModal')).show();
    }

    async deleteExpense() {
        const id = document.getElementById('deleteExpenseId').value;
        try {
            await expensesAPI.delete(id);
            utils.showMessage('تم حذف المصروف بنجاح');
            await this.loadExpenses();
            bootstrap.Modal.getInstance(document.getElementById('deleteExpenseModal')).hide();
        } catch (error) {
            console.error('Error deleting expense:', error);
            utils.showMessage('حدث خطأ في حذف المصروف', 'error');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('expenseForm');
        if (form) {
            form.addEventListener('submit', (e) => this.saveExpense(e));
        }

        const deleteBtn = document.getElementById('confirmDeleteExpense');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteExpense());
        }

        // تعيين التاريخ الحالي افتراضياً
        const dateInput = document.querySelector('input[name="date"]');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }
}

// تهيئة مدير المصاريف
let expensesManager;
document.addEventListener('DOMContentLoaded', function() {
    expensesManager = new ExpensesManager();
});