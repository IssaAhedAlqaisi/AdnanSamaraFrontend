// إدارة العملاء في الواجهة الأمامية
class ClientsManager {
    constructor() {
        this.clients = [];
        this.init();
    }

    async init() {
        await this.loadClients();
        this.setupEventListeners();
    }

    async loadClients() {
        try {
            this.clients = await clientsAPI.getAll();
            this.renderClientsTable();
            this.updateClientsStats();
        } catch (error) {
            console.error('Error loading clients:', error);
            utils.showMessage('حدث خطأ في تحميل بيانات العملاء', 'error');
        }
    }

    renderClientsTable() {
        const tbody = document.getElementById('clientsTable')?.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = this.clients.map(client => `
            <tr>
                <td>${client.id}</td>
                <td>${client.name}</td>
                <td>${client.type || 'عادي'}</td>
                <td>${client.phone}</td>
                <td>${client.email || '-'}</td>
                <td>${(client.total_purchases || 0).toLocaleString('ar-EG')} دينار</td>
                <td>${this.formatLastPurchase(client.last_purchase)}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="clientsManager.editClient(${client.id})">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="clientsManager.confirmDelete(${client.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    formatLastPurchase(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('ar-EG');
    }

    async updateClientsStats() {
        try {
            const stats = await clientsAPI.getStats();
            document.getElementById('totalCustomers').textContent = `${stats.total_clients} عميل`;
            document.getElementById('activeCustomers').textContent = `${stats.active_clients} عميل`;
            document.getElementById('vipCustomers').textContent = `${stats.vip_clients} عميل`;
            document.getElementById('totalSales').textContent = `${(stats.total_purchases || 0).toLocaleString('ar-EG')} دينار`;
        } catch (error) {
            console.error('Error loading clients stats:', error);
        }
    }

    async saveClient(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const clientData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            area: formData.get('area'),
            address: formData.get('address'),
            type: formData.get('customerType'),
            notes: formData.get('notes')
        };

        try {
            const id = formData.get('id');
            if (id) {
                await clientsAPI.update(id, clientData);
                utils.showMessage('تم تحديث بيانات العميل بنجاح');
            } else {
                await clientsAPI.create(clientData);
                utils.showMessage('تم إضافة العميل بنجاح');
            }

            await this.loadClients();
            bootstrap.Modal.getInstance(form.closest('.modal')).hide();
            form.reset();
        } catch (error) {
            utils.showMessage('حدث خطأ في حفظ بيانات العميل', 'error');
        }
    }

    async editClient(id) {
        try {
            const client = await clientsAPI.getById(id);
            const form = document.getElementById('customerForm');
            
            form.querySelector('input[name="id"]').value = client.id;
            form.querySelector('input[name="name"]').value = client.name;
            form.querySelector('input[name="phone"]').value = client.phone;
            form.querySelector('input[name="email"]').value = client.email || '';
            form.querySelector('input[name="area"]').value = client.area || '';
            form.querySelector('textarea[name="address"]').value = client.address || '';
            form.querySelector('select[name="customerType"]').value = client.type || 'regular';
            form.querySelector('textarea[name="notes"]').value = client.notes || '';

            new bootstrap.Modal(document.getElementById('addCustomerModal')).show();
        } catch (error) {
            utils.showMessage('حدث خطأ في تحميل بيانات العميل', 'error');
        }
    }

    confirmDelete(id) {
        document.getElementById('deleteCustomerId').value = id;
        new bootstrap.Modal(document.getElementById('deleteCustomerModal')).show();
    }

    async deleteClient() {
        const id = document.getElementById('deleteCustomerId').value;
        try {
            await clientsAPI.delete(id);
            utils.showMessage('تم حذف العميل بنجاح');
            await this.loadClients();
            bootstrap.Modal.getInstance(document.getElementById('deleteCustomerModal')).hide();
        } catch (error) {
            utils.showMessage('حدث خطأ في حذف العميل', 'error');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('customerForm');
        if (form) {
            form.addEventListener('submit', (e) => this.saveClient(e));
        }

        const deleteBtn = document.getElementById('confirmDeleteCustomer');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteClient());
        }

        const searchInput = document.getElementById('customerSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterClients(e.target.value));
        }
    }

    filterClients(searchTerm) {
        const filtered = this.clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phone.includes(searchTerm) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredClients(filtered);
    }

    renderFilteredClients(filteredClients) {
        const tbody = document.getElementById('clientsTable')?.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = filteredClients.map(client => `
            <tr>
                <td>${client.id}</td>
                <td>${client.name}</td>
                <td>${client.type || 'عادي'}</td>
                <td>${client.phone}</td>
                <td>${client.email || '-'}</td>
                <td>${(client.total_purchases || 0).toLocaleString('ar-EG')} دينار</td>
                <td>${this.formatLastPurchase(client.last_purchase)}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="clientsManager.editClient(${client.id})">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="clientsManager.confirmDelete(${client.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

// تهيئة مدير العملاء
let clientsManager;
document.addEventListener('DOMContentLoaded', function() {
    clientsManager = new ClientsManager();
});

