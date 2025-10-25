// إدارة المركبات في الواجهة الأمامية
class VehiclesManager {
    constructor() {
        this.vehicles = [];
        this.init();
    }

    async init() {
        await this.loadVehicles();
        this.setupEventListeners();
    }

    async loadVehicles() {
        try {
            this.vehicles = await vehiclesAPI.getAll();
            this.renderVehiclesTable();
            this.updateVehiclesStats();
        } catch (error) {
            console.error('Error loading vehicles:', error);
            utils.showMessage('حدث خطأ في تحميل بيانات المركبات', 'error');
            // بيانات تجريبية
            this.vehicles = [
                { id: 1, number: "V-001", driver_name: "محمد أحمد", current_location: "غزة - الرمال", status: "active" },
                { id: 2, number: "V-002", driver_name: "أحمد محمود", current_location: "غزة - تل الهوا", status: "active" }
            ];
            this.renderVehiclesTable();
            this.updateVehiclesStats();
        }
    }

    renderVehiclesTable() {
        const tbody = document.getElementById('vehiclesTable')?.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = this.vehicles.map(vehicle => `
            <tr>
                <td>${vehicle.number}</td>
                <td>${vehicle.driver_name}</td>
                <td>${vehicle.current_location || 'غير محدد'}</td>
                <td><span class="badge ${this.getStatusClass(vehicle.status)}">${this.getStatusText(vehicle.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="vehiclesManager.editVehicle(${vehicle.id})">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="vehiclesManager.confirmDelete(${vehicle.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="vehiclesManager.trackVehicle(${vehicle.id})">
                        <i class="fa-solid fa-map-marker-alt"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getStatusClass(status) {
        const classes = {
            'active': 'bg-success',
            'maintenance': 'bg-warning text-dark',
            'inactive': 'bg-secondary',
            'broken': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    getStatusText(status) {
        const texts = {
            'active': 'نشطة',
            'maintenance': 'تحت الصيانة',
            'inactive': 'غير نشطة',
            'broken': 'معطلة'
        };
        return texts[status] || status;
    }

    updateVehiclesStats() {
        const totalVehicles = this.vehicles.length;
        const activeVehicles = this.vehicles.filter(v => v.status === 'active').length;
        const maintenanceVehicles = this.vehicles.filter(v => v.status === 'maintenance').length;
        const latestLocation = this.vehicles.find(v => v.status === 'active')?.current_location || '-';

        document.getElementById('activeVehicles').textContent = `${activeVehicles} مركبات في الخدمة`;
        document.getElementById('maintenanceVehicles').textContent = `${maintenanceVehicles} مركبة`;
        document.getElementById('latestLocation').textContent = latestLocation;
    }

    async saveVehicle(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const vehicleData = {
            number: formData.get('number'),
            driver_name: formData.get('driver_name'),
            current_location: formData.get('current_location'),
            status: formData.get('status'),
            capacity: formData.get('capacity'),
            model: formData.get('model'),
            notes: formData.get('notes')
        };

        try {
            const id = formData.get('id');
            if (id) {
                await vehiclesAPI.update(id, vehicleData);
                utils.showMessage('تم تحديث بيانات المركبة بنجاح');
            } else {
                await vehiclesAPI.create(vehicleData);
                utils.showMessage('تم إضافة المركبة بنجاح');
            }

            await this.loadVehicles();
            bootstrap.Modal.getInstance(form.closest('.modal')).hide();
            form.reset();
        } catch (error) {
            console.error('Error saving vehicle:', error);
            utils.showMessage('حدث خطأ في حفظ بيانات المركبة', 'error');
        }
    }

    editVehicle(id) {
        const vehicle = this.vehicles.find(v => v.id === id);
        if (!vehicle) return;

        const form = document.getElementById('vehicleForm');
        form.querySelector('input[name="id"]').value = vehicle.id;
        form.querySelector('input[name="number"]').value = vehicle.number;
        form.querySelector('input[name="driver_name"]').value = vehicle.driver_name;
        form.querySelector('input[name="current_location"]').value = vehicle.current_location || '';
        form.querySelector('select[name="status"]').value = vehicle.status;
        form.querySelector('input[name="capacity"]').value = vehicle.capacity || '';
        form.querySelector('input[name="model"]').value = vehicle.model || '';
        form.querySelector('textarea[name="notes"]').value = vehicle.notes || '';

        new bootstrap.Modal(document.getElementById('addVehicleModal')).show();
    }

    trackVehicle(id) {
        const vehicle = this.vehicles.find(v => v.id === id);
        if (vehicle) {
            utils.showMessage(`تتبع المرك