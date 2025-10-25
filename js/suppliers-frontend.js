// إدارة الموردين في الواجهة الأمامية
class SuppliersManager {
    constructor() {
        this.suppliers = [];
        this.init();
    }

    async init() {
        await this.loadSuppliers();
        this.setupEventListeners();
    }

    async loadSuppliers() {
        try {
            this.suppliers = await suppliersAPI.getAll();
            this.renderSuppliersTable();
            this.updateSuppliersStats();
        } catch (error) {
            console.error('Error loading suppliers:', error);
            utils.showMessage('حدث خطأ في تحميل بيانات الموردين', 'error');
            // استخدام بيانات تجريبية للاختبار
            this.suppliers = [
                { id: 1, name: "شركة النور للمواد", source_type: "قطع غيار", area: "غزة", phone: "0591234567", price_per_meter: 2.5, status: "active" },
                { id: 2, name: "محمد أحمد للمواد", source_type: "وقود", area: "غزة", phone: "0597654321", price_per_tank: 450, status: "active" }
            ];
            this.renderSuppliersTable();
            this.updateSuppliersStats();
        }
    }

    renderSuppliersTable() {
        const tbody = document.getElementById('suppliersTable')?.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = this.suppliers.map(supplier => `
            <tr>
                <td>${supplier.id}</td>
                <td>${supplier.name}</td>
                <td>${supplier.source_type}</td>
                <td>${supplier.phone}</td>
                <td>${supplier.email || '-'}</td>
                <td>${this.calculateTotalPurchases(supplier)} دينار</td>
                <td><span class="badge ${this.getStatusClass(supplier.status)}">${this.getStatusText(supplier.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="suppliersManager.editSupplier(${supplier.id})">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="suppliersManager.confirmDelete(${supplier.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    calculateTotalPurchases(supplier) {
        // محاكاة إجمالي المشتريات - يمكن استبدالها ببيانات حقيقية
        return ((supplier.price_per_meter || 0) * 1000 + (supplier.price_per_tank || 0) * 10).toLocaleString('ar-EG');
    }

    getStatusClass(status) {
        const classes = {
            'active': 'bg-success',
            'inactive': 'bg-secondary',
            'pending': 'bg-warning text-dark'
        };
        return classes[status] || 'bg-secondary';
    }

    getStatusText(status) {
        const texts = {
            'active': 'نشط',
            'inactive': 'غير نشط',
            'pending': 'معلق'
        };
        return texts[status] || status;
    }

    updateSuppliersStats() {
        const totalSuppliers = this.suppliers.length;
        const activeSuppliers = this.suppliers.filter(s => s.status === 'active').length;
        const pendingSuppliers = this.suppliers.filter(s => s.status === 'pending').length;
        const totalPurchases = this.suppliers.reduce((sum, supplier) => sum + parseInt(this.calculateTotalPurchases(supplier).replace(/,/g, '')), 0);

        document.getElementById('totalSuppliers').textContent = `${totalSuppliers} مورد`;
        document.getElementById('activeSuppliers').textContent = `${activeSuppliers} مورد`;
        document.getElementById('pendingSuppliers').textContent = `${pendingSuppliers} مورد`;
        document.getElementById('totalPurchases').textContent = `${totalPurchases.toLocaleString('ar-EG')} دينار`;
    }

    async saveSupplier(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const supplierData = {
            name: formData.get('name'),
            source_type: formData.get('serviceType'),
            area: formData.get('area'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            price_per_meter: formData.get('pricePerMeter') || null,
            price_per_tank: formData.get('pricePerTank') || null,
            capacity: formData.get('capacity'),
            notes: formData.get('notes')
        };

        try {
            const id = formData.get('id');
            if (id) {
                // تحديث مورد موجود
                await suppliersAPI.update(id, supplierData);
                utils.showMessage('تم تحديث بيانات المورد بنجاح');
            } else {
                // إضافة مورد جديد
                await suppliersAPI.create(supplierData);
                utils.showMessage('تم إضافة المورد بنجاح');
            }

            await this.loadSuppliers();
            bootstrap.Modal.getInstance(form.closest('.modal')).hide();
            form.reset();
        } catch (error) {
            console.error('Error saving supplier:', error);
            utils.showMessage('حدث خطأ في حفظ بيانات المورد', 'error');
        }
    }

    editSupplier(id) {
        const supplier = this.suppliers.find(s => s.id === id);
        if (!supplier) return;

        const form = document.getElementById('supplierForm');
        form.querySelector('input[name="id"]').value = supplier.id;
        form.querySelector('input[name="name"]').value = supplier.name;
        form.querySelector('select[name="serviceType"]').value = supplier.source_type;
        form.querySelector('input[name="area"]').value = supplier.area || '';
        form.querySelector('input[name="phone"]').value = supplier.phone;
        form.querySelector('input[name="email"]').value = supplier.email || '';
        form.querySelector('input[name="pricePerMeter"]').value = supplier.price_per_meter || '';
        form.querySelector('input[name="pricePerTank"]').value = supplier.price_per_tank || '';
        form.querySelector('input[name="capacity"]').value = supplier.capacity || '';
        form.querySelector('textarea[name="notes"]').value = supplier.notes || '';

        new bootstrap.Modal(document.getElementById('addSupplierModal')).show();
    }

    confirmDelete(id) {
        document.getElementById('deleteSupplierId').value = id;
        new bootstrap.Modal(document.getElementById('deleteSupplierModal')).show();
    }

    async deleteSupplier() {
        const id = document.getElementById('deleteSupplierId').value;
        try {
            await suppliersAPI.delete(id);
            utils.showMessage('تم حذف المورد بنجاح');
            await this.loadSuppliers();
            bootstrap.Modal.getInstance(document.getElementById('deleteSupplierModal')).hide();
        } catch (error) {
            console.error('Error deleting supplier:', error);
            utils.showMessage('حدث خطأ في حذف المورد', 'error');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('supplierForm');
        if (form) {
            form.addEventListener('submit', (e) => this.saveSupplier(e));
        }

        const deleteBtn = document.getElementById('confirmDeleteSupplier');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteSupplier());
        }

        const searchInput = document.getElementById('supplierSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterSuppliers(e.target.value));
        }

        // إظهار/إخفاء الحقول حسب نوع الخدمة
        const serviceTypeSelect = document.querySelector('select[name="serviceType"]');
        if (serviceTypeSelect) {
            serviceTypeSelect.addEventListener('change', (e) => this.togglePriceFields(e.target.value));
        }
    }

    togglePriceFields(serviceType) {
        const meterGroup = document.getElementById('pricePerMeterGroup');
        const tankGroup = document.getElementById('pricePerTankGroup');
        
        if (serviceType === 'water') {
            meterGroup?.classList.remove('d-none');
            tankGroup?.classList.add('d-none');
        } else if (serviceType === 'fuel') {
            meterGroup?.classList.add('d-none');
            tankGroup?.classList.remove('d-none');
        } else {
            meterGroup?.classList.add('d-none');
            tankGroup?.classList.add('d-none');
        }
    }

    filterSuppliers(searchTerm) {
        const filtered = this.suppliers.filter(supplier =>
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.source_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.phone.includes(searchTerm)
        );
        this.renderFilteredSuppliers(filtered);
    }

    renderFilteredSuppliers(filteredSuppliers) {
        const tbody = document.getElementById('suppliersTable')?.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = filteredSuppliers.map(supplier => `
            <tr>
                <td>${supplier.id}</td>
                <td>${supplier.name}</td>
                <td>${supplier.source_type}</td>
                <td>${supplier.phone}</td>
                <td>${supplier.email || '-'}</td>
                <td>${this.calculateTotalPurchases(supplier)} دينار</td>
                <td><span class="badge ${this.getStatusClass(supplier.status)}">${this.getStatusText(supplier.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="suppliersManager.editSupplier(${supplier.id})">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="suppliersManager.confirmDelete(${supplier.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

// تهيئة مدير الموردين
let suppliersManager;
document.addEventListener('DOMContentLoaded', function() {
    suppliersManager = new SuppliersManager();
});