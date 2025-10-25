// إدارة الموظفين في الواجهة الأمامية
class EmployeesManager {
    constructor() {
        this.employees = [];
        this.init();
    }

    async init() {
        await this.loadEmployees();
        this.setupEventListeners();
    }

    async loadEmployees() {
        try {
            this.employees = await employeesAPI.getAll();
            this.renderEmployeesTable();
            this.updateEmployeesStats();
        } catch (error) {
            console.error('Error loading employees:', error);
            utils.showMessage('حدث خطأ في تحميل بيانات الموظفين', 'error');
            // بيانات تجريبية
            this.employees = [
                { id: 1, name: "محمد أحمد", department: "drivers", salary: 1500, status: "active" },
                { id: 2, name: "أحمد محمود", department: "management", salary: 2000, status: "active" }
            ];
            this.renderEmployeesTable();
            this.updateEmployeesStats();
        }
    }

    renderEmployeesTable() {
        const tbody = document.getElementById('employeesTable')?.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = this.employees.map(employee => `
            <tr>
                <td>${employee.name}</td>
                <td>${this.getDepartmentText(employee.department)}</td>
                <td>${employee.salary.toLocaleString('ar-EG')} دينار</td>
                <td><span class="badge ${this.getStatusClass(employee.status)}">${this.getStatusText(employee.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="employeesManager.editEmployee(${employee.id})">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="employeesManager.confirmDelete(${employee.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getDepartmentText(department) {
        const departments = {
            'drivers': 'سائقين',
            'management': 'إدارة',
            'maintenance': 'صيانة',
            'sales': 'مبيعات',
            'other': 'أخرى'
        };
        return departments[department] || department;
    }

    getStatusClass(status) {
        const classes = {
            'active': 'bg-success',
            'trial': 'bg-warning text-dark',
            'inactive': 'bg-secondary',
            'expired': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    getStatusText(status) {
        const texts = {
            'active': 'نشط',
            'trial': 'تحت التجربة',
            'inactive': 'غير نشط',
            'expired': 'منتهي العقد'
        };
        return texts[status] || status;
    }

    updateEmployeesStats() {
        const totalEmployees = this.employees.length;
        const activeEmployees = this.employees.filter(e => e.status === 'active').length;
        const trialEmployees = this.employees.filter(e => e.status === 'trial').length;
        const expiredEmployees = this.employees.filter(e => e.status === 'expired').length;

        document.getElementById('activeEmployees').textContent = `${activeEmployees} موظف نشط`;
        document.getElementById('trialEmployees').textContent = `${trialEmployees} موظفين`;
        document.getElementById('expiredEmployees').textContent = `${expiredEmployees} موظفين`;
    }

    async saveEmployee(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const employeeData = {
            name: formData.get('name'),
            department: formData.get('department'),
            salary: parseFloat(formData.get('salary')),
            status: formData.get('status'),
            phone: formData.get('phone'),
            job_title: formData.get('job_title'),
            notes: formData.get('notes')
        };

        try {
            const id = formData.get('id');
            if (id) {
                await employeesAPI.update(id, employeeData);
                utils.showMessage('تم تحديث بيانات الموظف بنجاح');
            } else {
                await employeesAPI.create(employeeData);
                utils.showMessage('تم إضافة الموظف بنجاح');
            }

            await this.loadEmployees();
            bootstrap.Modal.getInstance(form.closest('.modal')).hide();
            form.reset();
        } catch (error) {
            console.error('Error saving employee:', error);
            utils.showMessage('حدث خطأ في حفظ بيانات الموظف', 'error');
        }
    }

    editEmployee(id) {
        const employee = this.employees.find(e => e.id === id);
        if (!employee) return;

        const form = document.getElementById('employeeForm');
        form.querySelector('input[name="id"]').value = employee.id;
        form.querySelector('input[name="name"]').value = employee.name;
        form.querySelector('select[name="department"]').value = employee.department;
        form.querySelector('input[name="salary"]').value = employee.salary;
        form.querySelector('select[name="status"]').value = employee.status;
        form.querySelector('input[name="phone"]').value = employee.phone || '';
        form.querySelector('input[name="job_title"]').value = employee.job_title || '';
        form.querySelector('textarea[name="notes"]').value = employee.notes || '';

        new bootstrap.Modal(document.getElementById('addEmployeeModal')).show();
    }

    confirmDelete(id) {
        document.getElementById('deleteEmployeeId').value = id;
        new bootstrap.Modal(document.getElementById('deleteEmployeeModal')).show();
    }

    async deleteEmployee() {
        const id = document.getElementById('deleteEmployeeId').value;
        try {
            await employeesAPI.delete(id);
            utils.showMessage('تم حذف الموظف بنجاح');
            await this.loadEmployees();
            bootstrap.Modal.getInstance(document.getElementById('deleteEmployeeModal')).hide();
        } catch (error) {
            console.error('Error deleting employee:', error);
            utils.showMessage('حدث خطأ في حذف الموظف', 'error');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('employeeForm');
        if (form) {
            form.addEventListener('submit', (e) => this.saveEmployee(e));
        }

        const deleteBtn = document.getElementById('confirmDeleteEmployee');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteEmployee());
        }
    }
}

// تهيئة مدير الموظفين
let employeesManager;
document.addEventListener('DOMContentLoaded', function() {
    employeesManager = new EmployeesManager();
});