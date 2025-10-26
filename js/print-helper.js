// 🧩 Helper لفتح العقود المروسة في صفحة جديدة
function openContract(path) {
  // فتح صفحة جديدة للعقد HTML
  window.open(path, '_blank');
}

// 📄 عقد توريد مياه
window.printWaterSupply = () => openContract('contracts/contract-water.html');

// 🚚 عقد استلام عهدة مركبة
window.printCarCustody = () => openContract('contracts/contract-vehicle.html');
