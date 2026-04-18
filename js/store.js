// ========================
// DATA LAYER (Store)
// ========================
let DB = {
  workers: [],
  attendance: {},  // { "YYYY-MM-DD": { workerId: status } }
  advances: [],
  otHours: {},     // { "YYYY-MM-DD": { workerId: hours } }
  materials: [
    { id: 'm1', name: 'Cement', unit: 'Bag', defaultRate: 350 },
    { id: 'm2', name: 'Sariya (Steel)', unit: 'Kg', defaultRate: 65 },
    { id: 'm3', name: 'Roodi', unit: 'Foot', defaultRate: 40 },
    { id: 'm4', name: 'Dust', unit: 'Foot', defaultRate: 35 },
    { id: 'm5', name: 'Raeth (Sand)', unit: 'Foot', defaultRate: 45 },
    { id: 'm6', name: 'Eenth (Brick)', unit: 'Piece', defaultRate: 7 }
  ],
  purchases: []
};

let SEC = {
  pin: null,
  bio: false
};

function saveDB() {
  localStorage.setItem('hisabkitab_db', JSON.stringify(DB));
}

function saveSec() {
  localStorage.setItem('hisabkitab_sec', JSON.stringify(SEC));
}

function loadDB() {
  const secRaw = localStorage.getItem('hisabkitab_sec');
  if (secRaw) SEC = JSON.parse(secRaw);

  const raw = localStorage.getItem('hisabkitab_db');
  if (raw) {
    const parsed = JSON.parse(raw);
    DB.workers = parsed.workers || [];
    DB.attendance = parsed.attendance || {};
    DB.advances = parsed.advances || [];
    DB.otHours = parsed.otHours || {};
    DB.materials = parsed.materials || [
      { id: 'm1', name: 'Cement', unit: 'Bag', defaultRate: 350 },
      { id: 'm2', name: 'Sariya (Steel)', unit: 'Kg', defaultRate: 65 },
      { id: 'm3', name: 'Roodi', unit: 'Foot', defaultRate: 40 },
      { id: 'm4', name: 'Dust', unit: 'Foot', defaultRate: 35 },
      { id: 'm5', name: 'Raeth (Sand)', unit: 'Foot', defaultRate: 45 },
      { id: 'm6', name: 'Eenth (Brick)', unit: 'Piece', defaultRate: 7 }
    ];
    DB.purchases = parsed.purchases || [];
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Backup & Restore functionality
function downloadBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(DB, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  const dateStr = new Date().toISOString().slice(0,10);
  downloadAnchorNode.setAttribute("download", `hisabkitab_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function restoreBackup(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const newDB = JSON.parse(e.target.result);
      if (newDB && typeof newDB === 'object') {
        DB.workers = newDB.workers || [];
        DB.attendance = newDB.attendance || {};
        DB.advances = newDB.advances || [];
        DB.otHours = newDB.otHours || {};
        DB.materials = newDB.materials || [
          { id: 'm1', name: 'Cement', unit: 'Bag', defaultRate: 350 },
          { id: 'm2', name: 'Sariya (Steel)', unit: 'Kg', defaultRate: 65 },
          { id: 'm3', name: 'Roodi', unit: 'Foot', defaultRate: 40 },
          { id: 'm4', name: 'Dust', unit: 'Foot', defaultRate: 35 },
          { id: 'm5', name: 'Raeth (Sand)', unit: 'Foot', defaultRate: 45 },
          { id: 'm6', name: 'Eenth (Brick)', unit: 'Piece', defaultRate: 7 }
        ];
        DB.purchases = newDB.purchases || [];
        saveDB();
        return true;
      }
    } catch (err) {
      console.error("Invalid JSON file", err);
      return false;
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  localStorage.removeItem('hisabkitab_db');
  DB = {
    workers: [],
    attendance: {},
    advances: [],
    otHours: {},
    materials: [
      { id: 'm1', name: 'Cement', unit: 'Bag', defaultRate: 350 },
      { id: 'm2', name: 'Sariya (Steel)', unit: 'Kg', defaultRate: 65 },
      { id: 'm3', name: 'Roodi', unit: 'Foot', defaultRate: 40 },
      { id: 'm4', name: 'Dust', unit: 'Foot', defaultRate: 35 },
      { id: 'm5', name: 'Raeth (Sand)', unit: 'Foot', defaultRate: 45 },
      { id: 'm6', name: 'Eenth (Brick)', unit: 'Piece', defaultRate: 7 }
    ],
    purchases: []
  };
}

// Initial Load
loadDB();
