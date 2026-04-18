// ========================
// PWA INSTALL PROMPT
// ========================
let _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredPrompt = e;
  const banner = document.getElementById('install-banner');
  if (banner) banner.classList.add('show');
});
window.addEventListener('appinstalled', () => {
  const banner = document.getElementById('install-banner');
  if (banner) banner.style.display = 'none';
  _deferredPrompt = null;
  showToast('App install ho gaya! 🎉', 'success');
});
function installApp() {
  if (!_deferredPrompt) {
    showToast('Browser mein: Share → "Add to Home Screen" se add karein', 'success');
    return;
  }
  _deferredPrompt.prompt();
  _deferredPrompt.userChoice.then(() => {
    _deferredPrompt = null;
    document.getElementById('install-banner').style.display = 'none';
  });
}

// ========================
// NAVIGATION
// ========================
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  const page = document.getElementById('page-' + name);
  if(page) page.classList.add('active');
  
  if(event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  } else {
    // Fallback if called programmatically
    const btn = document.querySelector(`.nav-btn[onclick*="${name}"]`);
    if(btn) btn.classList.add('active');
  }

  if (name === 'dashboard') renderDashboard();
  if (name === 'workers') renderWorkers();
  if (name === 'attendance') renderAttendance();
  if (name === 'advance') renderAdvances();
  if (name === 'materials') renderMaterials();
  if (name === 'hisab') renderHisab();
  if (name === 'settings') renderSettings();
}

// ========================
// THEME (Dark / Light)
// ========================
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('hisabkitab_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-btn');
  if (btn) {
    btn.textContent = theme === 'light' ? '🌙' : '☀️';
  }
}

// Check saved theme on load
const savedTheme = localStorage.getItem('hisabkitab_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ========================
// DATE UTILITIES
// ========================
function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  // dd/mm/yyyy format
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function setHeaderDate() {
  const d = new Date();
  document.getElementById('headerDate').textContent =
    d.toLocaleDateString('hi-IN', { weekday: 'short', day: 'numeric', month: 'long' });
}
setHeaderDate();

function syncDateDisplay(id) {
  const input = document.getElementById(id);
  const display = document.getElementById(id + '-display');
  if (input && display) {
    if (input.value) {
      display.textContent = formatDate(input.value);
    } else {
      display.textContent = 'dd/mm/yyyy';
    }
  }
}

// ========================
// WORKER COLORS
// ========================
const COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#ec4899','#14b8a6','#f59e0b','#ef4444'];
function workerColor(id) {
  const idx = DB.workers.findIndex(w => w.id === id);
  return COLORS[idx % COLORS.length];
}
function workerInitial(name) {
  return name ? name.trim()[0].toUpperCase() : '?';
}

// ========================
// MODAL
// ========================
function openModal(name) {
  if (name === 'add-advance') {
    const sel = document.getElementById('adv-worker');
    sel.innerHTML = DB.workers.map(w =>
      `<option value="${w.id}">${w.name} (₹${w.rate}/din)</option>`
    ).join('');
    document.getElementById('adv-date').value = today();
    syncDateDisplay('adv-date');
  }
  if (name === 'add-purchase') {
    const sel = document.getElementById('mat-select');
    sel.innerHTML = DB.materials.map(m =>
      `<option value="${m.id}">${m.name} (${m.unit})</option>`
    ).join('');
    document.getElementById('mat-date').value = today();
    syncDateDisplay('mat-date');
    setTimeout(updateMatRate, 50);
  }
  if (name === 'manage-materials') {
    renderManageMaterials();
  }
  document.getElementById('modal-' + name).classList.add('open');
}

function closeModal(name) {
  document.getElementById('modal-' + name).classList.remove('open');
  if (name === 'edit-worker') {
    const box = document.getElementById('delete-confirm-box');
    if (box) box.style.display = 'none';
  }
}

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('open');
  });
});

// ========================
// TOAST
// ========================
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ========================
// WORKERS
// ========================
function toggleOtherSkill(prefix) {
  const select = document.getElementById(`${prefix}-skill`);
  const input = document.getElementById(`${prefix}-skill-other`);
  if (select.value === 'Other') {
    input.style.display = 'block';
  } else {
    input.style.display = 'none';
  }
}

function addWorker() {
  const name = document.getElementById('w-name').value.trim();
  const phone = document.getElementById('w-phone').value.trim();
  let skill = document.getElementById('w-skill').value;
  if (skill === 'Other') {
    skill = document.getElementById('w-skill-other').value.trim() || 'Other';
  }
  const rate = parseInt(document.getElementById('w-rate').value);
  const otRate = parseInt(document.getElementById('w-ot-rate').value) || 0;

  if (!name || !rate) { showToast('Naam aur rate zaroori hai!', 'error'); return; }

  DB.workers.push({ id: uid(), name, phone, skill, rate, otRate, joinDate: today() });
  saveDB();
  closeModal('add-worker');
  ['w-name','w-phone','w-rate','w-ot-rate','w-skill-other'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('w-skill').value = 'Mason';
  document.getElementById('w-skill-other').style.display = 'none';
  renderWorkers();
  renderDashboard();
  showToast(`${name} add ho gaya! 👷`);
}

function openEditWorker(id) {
  const w = DB.workers.find(x => x.id === id);
  if (!w) return;
  document.getElementById('ew-id').value = w.id;
  document.getElementById('ew-name').value = w.name;
  document.getElementById('ew-phone').value = w.phone || '';

  const ewSkill = document.getElementById('ew-skill');
  const ewSkillOther = document.getElementById('ew-skill-other');
  const knownSkills = Array.from(ewSkill.options).map(o => o.value);
  if (knownSkills.includes(w.skill)) {
    ewSkill.value = w.skill;
    ewSkillOther.style.display = 'none';
    ewSkillOther.value = '';
  } else {
    ewSkill.value = 'Other';
    ewSkillOther.style.display = 'block';
    ewSkillOther.value = w.skill;
  }

  document.getElementById('ew-rate').value = w.rate;
  document.getElementById('ew-ot-rate').value = w.otRate || '';
  openModal('edit-worker');
}

function saveEditWorker() {
  const id = document.getElementById('ew-id').value;
  const w = DB.workers.find(x => x.id === id);
  if (!w) return;
  w.name = document.getElementById('ew-name').value.trim();
  w.phone = document.getElementById('ew-phone').value.trim();
  
  let skill = document.getElementById('ew-skill').value;
  if (skill === 'Other') {
    skill = document.getElementById('ew-skill-other').value.trim() || 'Other';
  }
  w.skill = skill;
  
  w.rate = parseInt(document.getElementById('ew-rate').value);
  w.otRate = parseInt(document.getElementById('ew-ot-rate').value) || 0;
  saveDB();
  closeModal('edit-worker');
  renderWorkers();
  renderDashboard();
  showToast('Update ho gaya! ✓');
}

function deleteWorker() {
  const id = document.getElementById('ew-id').value;
  if (!id) { showToast('Koi worker select nahi hai', 'error'); return; }
  const w = DB.workers.find(x => x.id === id);
  if (!w) { showToast('Worker nahi mila', 'error'); return; }

  const confirmBox = document.getElementById('delete-confirm-box');
  const confirmName = document.getElementById('delete-confirm-name');
  confirmName.textContent = w.name;
  confirmBox.style.display = 'block';
}

function confirmDeleteWorker() {
  const id = document.getElementById('ew-id').value;
  if (!id) return;
  DB.workers = DB.workers.filter(x => x.id !== id);
  
  Object.keys(DB.attendance).forEach(date => {
    if (DB.attendance[date][id]) delete DB.attendance[date][id];
  });
  Object.keys(DB.otHours || {}).forEach(date => {
    if (DB.otHours[date] && DB.otHours[date][id]) delete DB.otHours[date][id];
  });
  
  saveDB();
  document.getElementById('delete-confirm-box').style.display = 'none';
  closeModal('edit-worker');
  renderWorkers();
  renderDashboard();
  showToast('Majdoor hata diya ✓', 'error');
}

function cancelDeleteWorker() {
  document.getElementById('delete-confirm-box').style.display = 'none';
}

function renderWorkers() {
  const grid = document.getElementById('worker-grid');
  if (!DB.workers.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="empty-icon">👷</div>
      <div class="empty-title">Koi majdoor nahi hai</div>
      <div class="empty-sub">Upar "+ Naya Majdoor" button dabaao</div>
    </div>`;
    return;
  }

  grid.innerHTML = DB.workers.map(w => {
    const color = workerColor(w.id);
    const todayAtt = (DB.attendance[today()] || {})[w.id] || 'none';
    const attMap = { present: { label: 'Haazir', cls: 'tag-green' }, absent: { label: 'Gair-Haazir', cls: 'tag-red' }, half: { label: 'Aadha Din', cls: 'tag-yellow' }, overtime: { label: 'Overtime', cls: 'tag-blue' }, none: { label: 'Aaj Nahi Aaya', cls: '' } };
    const att = attMap[todayAtt] || attMap.none;
    const totalAdv = DB.advances.filter(a => a.workerId === w.id).reduce((s, a) => s + a.amount, 0);

    return `<div class="worker-card" onclick="openEditWorker('${w.id}')">
      <div class="worker-avatar" style="background:${color}">${workerInitial(w.name)}</div>
      <div class="worker-name">${w.name}</div>
      <div class="worker-skill">${w.skill} ${w.phone ? '· 📞 ' + w.phone : ''}</div>
      <div class="worker-rate">₹${w.rate.toLocaleString('en-IN')}<span>/din</span></div>
      <div class="worker-meta">
        ${att.cls ? `<span class="worker-tag ${att.cls}">${att.label}</span>` : ''}
        ${totalAdv > 0 ? `<span class="worker-tag tag-red">Advance ₹${totalAdv.toLocaleString('en-IN')}</span>` : ''}
        ${w.otRate ? `<span class="worker-tag tag-blue">OT ₹${w.otRate}/hr</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ========================
// ATTENDANCE
// ========================
function setToday() {
  document.getElementById('att-date').value = today();
  syncDateDisplay('att-date');
  renderAttendance();
}

function renderAttendance() {
  const dateEl = document.getElementById('att-date');
  if (!dateEl.value) {
    dateEl.value = today();
    syncDateDisplay('att-date');
  }
  const date = dateEl.value;
  const dayAtt = DB.attendance[date] || {};

  if (!DB.workers.length) {
    document.getElementById('attendance-list').innerHTML = `<div class="empty">
      <div class="empty-icon">👷</div>
      <div class="empty-title">Koi majdoor nahi</div>
      <div class="empty-sub">Pehle Majdoor tab mein add karo</div>
    </div>`;
    return;
  }

  let dayTotal = 0;
  DB.workers.forEach(w => {
    const status = dayAtt[w.id] || 'none';
    const otH = ((DB.otHours[date] || {})[w.id]) || 0;
    if (status === 'present') dayTotal += w.rate;
    else if (status === 'half') dayTotal += Math.round(w.rate / 2);
    else if (status === 'overtime') dayTotal += w.rate + (otH * (w.otRate || 0));
  });

  document.getElementById('att-day-total').textContent = dayTotal > 0 ? `Aaj ka kharcha: ₹${dayTotal.toLocaleString('en-IN')}` : '';

  document.getElementById('attendance-list').innerHTML = DB.workers.map(w => {
    const status = dayAtt[w.id] || 'none';
    const color = workerColor(w.id);
    const otH = ((DB.otHours[date] || {})[w.id]) || 0;

    return `<div class="att-worker-row">
      <div class="att-info">
        <div class="att-avatar" style="background:${color}">${workerInitial(w.name)}</div>
        <div>
          <div class="att-name">${w.name}</div>
          <div class="att-rate">₹${w.rate}/din</div>
        </div>
      </div>
      <div class="att-btns">
        <button class="att-btn ${status==='present'?'att-present':''}" onclick="markAtt('${date}','${w.id}','present')">✓ Haazir</button>
        <button class="att-btn ${status==='absent'?'att-absent':''}" onclick="markAtt('${date}','${w.id}','absent')">✗ Gair</button>
        <button class="att-btn ${status==='half'?'att-half':''}" onclick="markAtt('${date}','${w.id}','half')">½ Aadha</button>
        <button class="att-btn ${status==='overtime'?'att-overtime':''}" onclick="markOT('${date}','${w.id}')">⏰ OT</button>
      </div>
    </div>`;
  }).join('');
}

function markAtt(date, workerId, status) {
  if (!DB.attendance[date]) DB.attendance[date] = {};
  if (DB.attendance[date][workerId] === status) {
    delete DB.attendance[date][workerId];
  } else {
    DB.attendance[date][workerId] = status;
  }
  saveDB();
  renderAttendance();
  renderDashboard();
}

function markOT(date, workerId) {
  const w = DB.workers.find(x => x.id === workerId);
  const hrs = prompt(`${w.name} ne kitne ghante overtime kiya?`, '2');
  if (!hrs || isNaN(hrs)) return;
  if (!DB.otHours[date]) DB.otHours[date] = {};
  DB.otHours[date][workerId] = parseFloat(hrs);
  if (!DB.attendance[date]) DB.attendance[date] = {};
  DB.attendance[date][workerId] = 'overtime';
  saveDB();
  renderAttendance();
  showToast(`${w.name}: ${hrs} ghante OT save ✓`);
}

// ========================
// ADVANCE
// ========================
function addAdvance() {
  const workerId = document.getElementById('adv-worker').value;
  const amount = parseInt(document.getElementById('adv-amount').value);
  const date = document.getElementById('adv-date').value;
  const note = document.getElementById('adv-note').value.trim();

  if (!workerId || !amount || !date) { showToast('Sab fields zaroori hain!', 'error'); return; }

  const w = DB.workers.find(x => x.id === workerId);
  DB.advances.push({ id: uid(), workerId, amount, date, note });
  saveDB();
  closeModal('add-advance');
  document.getElementById('adv-amount').value = '';
  document.getElementById('adv-note').value = '';
  renderAdvances();
  renderDashboard();
  showToast(`${w.name} ko ₹${amount} advance diya ✓`);
}

function deleteAdvance(id) {
  if (!confirm('Yeh advance record hatayein?')) return;
  DB.advances = DB.advances.filter(a => a.id !== id);
  saveDB();
  renderAdvances();
  renderDashboard();
  showToast('Advance record hata diya', 'error');
}

function renderAdvances() {
  const el = document.getElementById('advance-list');
  if (!DB.advances.length) {
    el.innerHTML = `<div class="empty">
      <div class="empty-icon">💸</div>
      <div class="empty-title">Koi advance nahi</div>
      <div class="empty-sub">Jab koi advance maange tab yahaan record karo</div>
    </div>`;
    return;
  }

  const sorted = [...DB.advances].sort((a,b) => b.date.localeCompare(a.date));
  el.innerHTML = sorted.map(a => {
    const w = DB.workers.find(x => x.id === a.workerId);
    if (!w) return '';
    const color = workerColor(w.id);
    return `<div class="advance-row">
      <div style="display:flex;align-items:center;gap:14px;min-width:160px;">
        <div style="width:42px;height:42px;border-radius:12px;background:${color};display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:18px;">${workerInitial(w.name)}</div>
        <div>
          <div style="font-size:15px;font-weight:700;color:var(--text)">${w.name}</div>
          <div style="font-size:12px;color:var(--text3)">${formatDate(a.date)}${a.note ? ' · ' + a.note : ''}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-size:18px;font-weight:800;color:var(--red)">₹${a.amount.toLocaleString('en-IN')}</div>
        <button class="btn-icon" onclick="deleteAdvance('${a.id}')" title="Hatao">🗑</button>
      </div>
    </div>`;
  }).join('');
}

// ========================
// HISAB (CALCULATION)
// ========================
function setThisMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const lastDay = new Date(y, d.getMonth()+1, 0).getDate();
  document.getElementById('hisab-from').value = `${y}-${m}-01`;
  document.getElementById('hisab-to').value = `${y}-${m}-${lastDay}`;
  syncDateDisplay('hisab-from');
  syncDateDisplay('hisab-to');
  renderHisab();
}

function calcWorkerHisab(worker, fromDate, toDate) {
  let presentDays = 0, halfDays = 0, otDays = 0, otHours = 0;

  Object.entries(DB.attendance).forEach(([date, dayAtt]) => {
    if (date < fromDate || date > toDate) return;
    const status = dayAtt[worker.id];
    if (status === 'present') presentDays++;
    else if (status === 'half') halfDays++;
    else if (status === 'overtime') {
      otDays++;
      otHours += ((DB.otHours[date] || {})[worker.id]) || 0;
    }
  });

  const totalDays = presentDays + halfDays + otDays;
  const earned = (presentDays * worker.rate) + (halfDays * Math.round(worker.rate/2)) + (otDays * worker.rate) + (otHours * (worker.otRate || 0));
  const advance = DB.advances.filter(a => a.workerId === worker.id && a.date >= fromDate && a.date <= toDate).reduce((s,a) => s+a.amount, 0);
  const net = earned - advance;

  return { presentDays, halfDays, otDays, otHours, totalDays, earned, advance, net };
}

function renderHisab() {
  const from = document.getElementById('hisab-from').value;
  const to = document.getElementById('hisab-to').value;
  if (!from || !to) return;

  if (!DB.workers.length) {
    document.getElementById('hisab-table-wrap').innerHTML = `<div class="empty"><div class="empty-icon">👷</div><div class="empty-title">Koi majdoor nahi</div></div>`;
    return;
  }

  let grandTotal = 0, grandAdvance = 0;
  const rows = DB.workers.map(w => {
    const h = calcWorkerHisab(w, from, to);
    grandTotal += h.earned;
    grandAdvance += h.advance;
    return { w, h };
  });

  const grandNet = grandTotal - grandAdvance;

  document.getElementById('hisab-summary-box').innerHTML = `
    <div class="summary-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <div class="summary-big">₹${grandNet.toLocaleString('en-IN')}</div>
          <div class="summary-label">Kul Dena Baaki · ${formatDate(from)} — ${formatDate(to)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px;color:var(--text3)">Kul Kamaaya</div>
          <div style="font-size:22px;font-weight:800;color:var(--text)">₹${grandTotal.toLocaleString('en-IN')}</div>
          <div style="font-size:13px;color:var(--red);margin-top:2px;">Advance: −₹${grandAdvance.toLocaleString('en-IN')}</div>
        </div>
      </div>
    </div>`;

  document.getElementById('hisab-table-wrap').innerHTML = `
    <div style="overflow-x:auto;">
    <table class="hisab-table">
      <thead>
        <tr>
          <th>Majdoor</th>
          <th>Haaziri</th>
          <th>Kamaaya</th>
          <th>Advance</th>
          <th>Net Dena</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({w, h}) => `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:34px;height:34px;border-radius:10px;background:${workerColor(w.id)};display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:14px;flex-shrink:0;">${workerInitial(w.name)}</div>
                <div>
                  <div class="td-name">${w.name}</div>
                  <div style="font-size:12px;color:var(--text3)">${w.skill}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-size:13px;color:var(--text2)">
                ${(h.presentDays + h.otDays) > 0 ? `<span style="color:var(--green);font-weight:600;">${h.presentDays + h.otDays} din</span>` : ''}
                ${h.halfDays > 0 ? ` + <span style="color:var(--yellow);font-weight:600;">${h.halfDays} aadhe</span>` : ''}
                ${h.otHours > 0 ? ` <span style="color:var(--blue);font-weight:600;">(OT ${h.otHours} hr)</span>` : ''}
                ${h.totalDays === 0 ? '<span style="color:var(--text3)">Koi nahi</span>' : ''}
              </div>
            </td>
            <td class="td-amount">₹${h.earned.toLocaleString('en-IN')}</td>
            <td style="color:var(--red);font-weight:600;">${h.advance > 0 ? '−₹'+h.advance.toLocaleString('en-IN') : '—'}</td>
            <td class="${h.net >= 0 ? 'td-amount' : 'td-pending'}" style="font-size:16px;">₹${h.net.toLocaleString('en-IN')}</td>
            <td>
              <div style="display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" onclick="showHisabDetail('${w.id}','${from}','${to}')">Detail</button>
                ${w.phone ? `<button class="wa-btn" onclick="sendWA('${w.id}','${from}','${to}')">📲 WA</button>` : ''}
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
    </div>`;
}

function showHisabDetail(wId, from, to) {
  const w = DB.workers.find(x => x.id === wId);
  if(!w) return;
  const h = calcWorkerHisab(w, from, to);
  const advList = DB.advances.filter(a => a.workerId === wId && a.date >= from && a.date <= to);

  const color = workerColor(w.id);

  let attDetails = [];
  Object.entries(DB.attendance).forEach(([date, dayAtt]) => {
    if (date < from || date > to) return;
    const status = dayAtt[w.id];
    if (!status) return;
    const otH = ((DB.otHours[date] || {})[w.id]) || 0;
    
    let amt = 0;
    if (status === 'present') amt = w.rate;
    else if (status === 'half') amt = Math.round(w.rate/2);
    else if (status === 'overtime') amt = w.rate + (otH * (w.otRate||0));
    attDetails.push({ date, status, otH, amt });
  });
  attDetails.sort((a,b) => a.date.localeCompare(b.date));

  document.getElementById('hisab-detail-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
      <div style="width:56px;height:56px;border-radius:16px;background:${color};display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">${workerInitial(w.name)}</div>
      <div>
        <div style="font-size:20px;font-weight:800;color:var(--text)">${w.name}</div>
        <div style="font-size:14px;color:var(--text3)">${w.skill} · ₹${w.rate}/din</div>
      </div>
    </div>
    
    <div style="background:var(--surface2);border-radius:12px;padding:16px;margin-bottom:20px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><div style="font-size:12px;color:var(--text3);margin-bottom:2px;">Kul Din</div><div style="font-size:22px;font-weight:800;color:var(--text)">${h.totalDays}</div></div>
        <div><div style="font-size:12px;color:var(--text3);margin-bottom:2px;">Kul Kamaaya</div><div style="font-size:22px;font-weight:800;color:var(--green)">₹${h.earned.toLocaleString('en-IN')}</div></div>
        <div><div style="font-size:12px;color:var(--text3);margin-bottom:2px;">Advance Diya</div><div style="font-size:22px;font-weight:800;color:var(--red)">₹${h.advance.toLocaleString('en-IN')}</div></div>
        <div><div style="font-size:12px;color:var(--text3);margin-bottom:2px;">Net Dena</div><div style="font-size:22px;font-weight:800;color:var(--accent)">₹${h.net.toLocaleString('en-IN')}</div></div>
      </div>
    </div>
    
    ${attDetails.length ? `
    <div style="font-size:13px;font-weight:700;color:var(--text3);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Haaziri Detail</div>
    <div style="max-height:220px;overflow-y:auto;padding-right:8px;margin-bottom:16px;">
      ${attDetails.map(a => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;">
          <span style="color:var(--text2)">${formatDate(a.date)}</span>
          <span>${a.status==='present'?'<span style="color:var(--green);font-weight:600;">✓ Haazir</span>':a.status==='absent'?'<span style="color:var(--red);font-weight:600;">✗ Gair</span>':a.status==='half'?'<span style="color:var(--yellow);font-weight:600;">½ Aadha</span>':'<span style="color:var(--blue);font-weight:600;">✓ Haazir + ⏰ OT '+(a.otH||0)+'hr</span>'}</span>
          <span style="font-weight:700;color:var(--text)">₹${a.amt.toLocaleString('en-IN')}</span>
        </div>`).join('')}
    </div>` : ''}
    
    ${advList.length ? `
    <div style="font-size:13px;font-weight:700;color:var(--text3);margin:16px 0 10px;text-transform:uppercase;letter-spacing:0.5px;">Advance List</div>
    <div style="padding-right:8px;">
    ${advList.map(a => `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;">
        <span style="color:var(--text2)">${formatDate(a.date)}${a.note?' · '+a.note:''}</span>
        <span style="font-weight:700;color:var(--red)">−₹${a.amount.toLocaleString('en-IN')}</span>
      </div>`).join('')}
      </div>` : ''}
      
    <div style="margin-top:24px;display:flex;gap:12px;flex-direction:column;">
      <button class="btn btn-outline" style="justify-content:center;font-size:15px;font-weight:700;color:var(--text);border-color:var(--text3);" onclick="window.print()">🖨️ PDF / Print Download</button>
      ${w.phone ? `<button class="wa-btn" style="justify-content:center;padding:12px;" onclick="sendWA('${w.id}','${from}','${to}')"><span style="font-size:18px;">📲</span> WhatsApp pe Bhejo</button>` : '<div style="font-size:13px;color:var(--text3);text-align:center;width:100%;background:rgba(255,255,255,0.05);padding:10px;border-radius:10px;">WhatsApp ke liye edit karke phone number add karein</div>'}
    </div>`;

  openModal('hisab-detail');
}

// ========================
// WHATSAPP
// ========================
function sendWA(wId, from, to) {
  const w = DB.workers.find(x => x.id === wId);
  const h = calcWorkerHisab(w, from, to);
  const advList = DB.advances.filter(a => a.workerId === wId && a.date >= from && a.date <= to);

  let msg = `🏗️ *HISAB — ${w.name}*\n`;
  msg += `📅 ${formatDate(from)} se ${formatDate(to)}\n\n`;
  msg += `━━━━━━━━━━━━━━━\n`;
  const totalHaazir = h.presentDays + h.otDays;
  msg += `✅ Haazir din: *${totalHaazir}*\n`;
  if (h.halfDays) msg += `½ Aadhe din: *${h.halfDays}*\n`;
  if (h.otHours > 0) msg += `⏰ Overtime: *${h.otHours} ghante*\n`;
  msg += `📊 Kul din: *${h.totalDays}*\n\n`;
  
  msg += `💰 Daily Rate: ₹${w.rate}/din\n`;
  if (h.otHours > 0 && w.otRate) msg += `⏱️ OT Rate: ₹${w.otRate}/ghante\n`;
  msg += `💵 Kul Kamaaya: *₹${h.earned.toLocaleString('en-IN')}*\n`;
  if (h.advance > 0) {
    msg += `\n💸 Advance Diya:\n`;
    advList.forEach(a => { msg += `   • ${formatDate(a.date)}: ₹${a.amount}${a.note?' ('+a.note+')':''}\n`; });
    msg += `   Kul Advance: *₹${h.advance.toLocaleString('en-IN')}*\n`;
  }
  msg += `\n━━━━━━━━━━━━━━━\n`;
  msg += `💳 *NET DENA: ₹${h.net.toLocaleString('en-IN')}*\n`;
  msg += `━━━━━━━━━━━━━━━\n\n`;
  msg += `_HisabKitab PWA se bheja gaya_`;

  const phone = w.phone.replace(/\D/g,'');
  const fullPhone = phone.startsWith('91') ? phone : '91' + phone;
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ========================
// ANIMATION UTIL
// ========================
function animateValue(id, target, prefix = '') {
  const obj = document.getElementById(id);
  if (!obj) return;
  // If target is 0, just set it immediately to avoid unnecessary animation loop
  if (target === 0) {
    obj.textContent = prefix + '0';
    return;
  }
  const duration = 1200; // 1.2 seconds
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    // cubic ease out
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(easeProgress * target);
    obj.textContent = prefix + current.toLocaleString('en-IN');
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.textContent = prefix + target.toLocaleString('en-IN');
    }
  };
  window.requestAnimationFrame(step);
}

// ========================
// DASHBOARD
// ========================
function renderDashboard() {
  const todayStr = today();
  const d = new Date();
  const monthStr = d.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });

  animateValue('stat-total', DB.workers.length);

  const todayAtt = DB.attendance[todayStr] || {};
  const presentToday = Object.values(todayAtt).filter(s => s === 'present' || s === 'overtime').length;
  animateValue('stat-present', presentToday);
  document.getElementById('stat-month-label').textContent = monthStr;

  const mFrom = monthStart();
  let monthlyTotal = 0;
  DB.workers.forEach(w => {
    const h = calcWorkerHisab(w, mFrom, todayStr);
    monthlyTotal += h.earned;
  });
  animateValue('stat-monthly', monthlyTotal, '₹');

  const totalAdv = DB.advances.reduce((s,a) => s+a.amount, 0);
  animateValue('stat-advance', totalAdv, '₹');

  const totalSaaman = (DB.purchases || []).reduce((s, p) => s + p.totalAmount, 0);
  animateValue('stat-saaman', totalSaaman, '₹');

  const counts = { present:0, absent:0, half:0, overtime:0 };
  Object.values(todayAtt).forEach(s => { if (counts[s] !== undefined) counts[s]++; });
  animateValue('dash-present-count', counts.present + counts.overtime);
  animateValue('dash-absent-count', counts.absent);
  animateValue('dash-half-count', counts.half);
  animateValue('dash-ot-count', counts.overtime);

  if (!DB.workers.length) {
    document.getElementById('dash-attendance-list').innerHTML = `<div class="empty">
      <div class="empty-icon">👷</div>
      <div class="empty-title">Koi majdoor nahi</div>
      <div class="empty-sub">Pehle "Majdoor" tab mein worker add karo</div>
    </div>`;
    return;
  }

  document.getElementById('dash-attendance-list').innerHTML = DB.workers.map(w => {
    const status = todayAtt[w.id] || 'none';
    const color = workerColor(w.id);
    const statusMap = {
      present: { label: '✓ Haazir', cls: 'tag-green' },
      absent:  { label: '✗ Gair', cls: 'tag-red' },
      half:    { label: '½ Aadha', cls: 'tag-yellow' },
      overtime:{ label: '⏰ Overtime', cls: 'tag-blue' },
      none:    { label: 'Mark Nahi', cls: '' }
    };
    const sm = statusMap[status];

    return `<div class="att-worker-row" style="padding:12px 0;">
      <div class="att-info">
        <div class="att-avatar" style="width:36px;height:36px;font-size:16px;background:${color}">${workerInitial(w.name)}</div>
        <div>
          <div class="att-name" style="font-size:14px;">${w.name}</div>
          <div class="att-rate" style="font-size:12px;">${w.skill} · ₹${w.rate}/din</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        ${sm.cls ? `<span class="worker-tag ${sm.cls}" style="font-size:12px;padding:4px 10px;">${sm.label}</span>` : `<span style="font-size:13px;color:var(--text3);font-weight:500;">Mark Nahi</span>`}
        <button class="btn btn-outline btn-sm" onclick="showPage('attendance')">Mark Karo</button>
      </div>
    </div>`;
  }).join('');
}


// ========================
// SETTINGS
// ========================
function renderSettings() {
  // Empty render logic since UI handles it, but this hooks into the nav
}

function handleRestore(event) {
  if (confirm("Restore karne par aapka purana data hutt jayega aur nayi file ka data aayega. Pakka karna hai?")) {
    if (restoreBackup(event.target)) {
       showToast("Data restore ho gaya!", "success");
       event.target.value = ''; // Reset
       renderDashboard();
    }
  } else {
    event.target.value = '';
  }
}

function handleClearData() {
  if (confirm("⚠️ WARNING ⚠️\nKya aap sach mein saara data udana chahte hain? Sab majdoor, haaziri aur hisab delete ho jayega!")) {
    clearAllData();
    showToast("Saara data clear ho gaya", "error");
    renderDashboard();
    showPage('dashboard');
  }
}


// ========================
// MATERIALS (SAAMAN)
// ========================
function updateMatRate() {
  const mId = document.getElementById('mat-select').value;
  const mat = DB.materials.find(x => x.id === mId);
  if (mat) {
    document.getElementById('mat-rate').value = mat.defaultRate || '';
  }
  calcMatTotal();
}

function calcMatTotal() {
  const qty = parseFloat(document.getElementById('mat-qty').value) || 0;
  const rate = parseFloat(document.getElementById('mat-rate').value) || 0;
  document.getElementById('mat-total').value = Math.round(qty * rate);
}

function addPurchase() {
  const materialId = document.getElementById('mat-select').value;
  const qty = parseFloat(document.getElementById('mat-qty').value);
  const rate = parseFloat(document.getElementById('mat-rate').value);
  const totalAmount = parseInt(document.getElementById('mat-total').value);
  const date = document.getElementById('mat-date').value;
  const note = document.getElementById('mat-note').value.trim();

  if (!materialId || !qty || !rate || !date) { showToast('Sab details bhari jani chahiye', 'error'); return; }

  DB.purchases.push({ id: uid(), materialId, qty, rate, totalAmount, date, note });
  saveDB();
  closeModal('add-purchase');
  document.getElementById('mat-qty').value = '';
  document.getElementById('mat-note').value = '';
  renderMaterials();
  showToast('Saaman ki entry save ho gayi! 🧱');
}

function deletePurchase(pId) {
  if (!confirm('Yeh entry pakka hatani hai?')) return;
  DB.purchases = DB.purchases.filter(p => p.id !== pId);
  saveDB();
  renderMaterials();
  showToast('Entry delete ho gayi', 'error');
}

function renderMaterials() {
  const statsEl = document.getElementById('materials-stats');
  const listEl = document.getElementById('materials-list');
  
  if (!DB.purchases || !DB.purchases.length) {
    statsEl.innerHTML = '';
    listEl.innerHTML = `<div class="empty"><div class="empty-icon">🧱</div><div class="empty-title">Koi saaman nahi lagaya</div><div class="empty-sub">Upar "+ Naya Saaman" dabayein</div></div>`;
    return;
  }

  let totalCost = 0;
  let thisMonthCost = 0;
  const mFrom = monthStart();
  
  const sorted = [...DB.purchases].sort((a,b) => b.date.localeCompare(a.date));
  
  listEl.innerHTML = sorted.map(p => {
    const m = DB.materials.find(x => x.id === p.materialId);
    if (!m) return '';
    totalCost += p.totalAmount;
    if (p.date >= mFrom) thisMonthCost += p.totalAmount;

    return `<div class="advance-row">
      <div style="display:flex;align-items:center;gap:14px;min-width:160px;">
        <div style="width:42px;height:42px;border-radius:12px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:24px;">🧱</div>
        <div>
          <div style="font-size:15px;font-weight:700;color:var(--text)">${m.name}</div>
          <div style="font-size:12px;color:var(--text3)">${formatDate(p.date)} · ${p.qty} ${m.unit} @ ₹${p.rate}</div>
          ${p.note ? `<div style="font-size:11px;color:var(--text2);margin-top:2px;">${p.note}</div>` : ''}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-size:16px;font-weight:800;color:var(--accent)">₹${p.totalAmount.toLocaleString('en-IN')}</div>
        <button class="btn-icon" onclick="deletePurchase('${p.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Kul Saaman Kharch</div>
      <div class="stat-val accent">₹${totalCost.toLocaleString('en-IN')}</div>
      <div class="stat-sub">Shuru se ab tak</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Is Mahine Saaman</div>
      <div class="stat-val green">₹${thisMonthCost.toLocaleString('en-IN')}</div>
      <div class="stat-sub">Current bharna</div>
    </div>
  `;
}

function renderManageMaterials() {
  const listEl = document.getElementById('manage-mat-list');
  listEl.innerHTML = DB.materials.map(m => `
    <div style="display:flex;justify-content:space-between; align-items:center; padding:10px 0;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-weight:700;color:var(--text);">${m.name}</div>
        <div style="font-size:12px;color:var(--text3);">${m.unit}</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <div style="color:var(--text3);font-size:14px;font-weight:600;">₹</div>
        <input type="number" class="form-input" style="width:70px;height:32px;padding:4px 8px;font-size:14px;text-align:right;" value="${m.defaultRate}" onchange="updateMatDefaultRate('${m.id}', this.value)">
        <button class="btn-icon" style="color:var(--red); font-size:16px;" onclick="deleteMaterial('${m.id}')" title="Hatao">🗑</button>
      </div>
    </div>
  `).join('');
}

function updateMatDefaultRate(id, val) {
  const rate = parseFloat(val) || 0;
  const mat = DB.materials.find(x => x.id === id);
  if (mat) {
    mat.defaultRate = rate;
    saveDB();
    showToast('Rate update ho gaya ✓');
  }
}

function deleteMaterial(id) {
  if (!confirm('Kya is item ko pakka delete karna hai?')) return;
  DB.materials = DB.materials.filter(m => m.id !== id);
  saveDB();
  renderManageMaterials();
  showToast('Item hata diya gaya', 'error');
}

function addNewMaterial() {
  const name = document.getElementById('new-mat-name').value.trim();
  const unit = document.getElementById('new-mat-unit').value.trim();
  const rate = parseFloat(document.getElementById('new-mat-rate').value);

  if (!name || !unit || !rate) {
    showToast('Sabhi details bharein', 'error');
    return;
  }

  DB.materials.push({ id: uid(), name, unit, defaultRate: rate });
  saveDB();
  document.getElementById('new-mat-name').value = '';
  document.getElementById('new-mat-unit').value = '';
  document.getElementById('new-mat-rate').value = '';
  renderManageMaterials();
  showToast('Naya item add ho gaya!');
}

// ========================
// APP SECURITY (LOCK SCREEN)
// ========================

let currentPIN = "";
let setupMode = false;
let setupPINValue = null;

function pressPIN(num) {
  if (currentPIN.length < 4) {
    currentPIN += num;
    updatePINDots();
  }
  if (currentPIN.length === 4) {
    setTimeout(processPIN, 100);
  }
}

function clearPIN() {
  currentPIN = currentPIN.slice(0, -1);
  updatePINDots();
}

function updatePINDots() {
  const dots = document.querySelectorAll('.pin-dot');
  dots.forEach((dot, i) => {
    if (i < currentPIN.length) dot.classList.add('filled');
    else dot.classList.remove('filled');
  });
}

function processPIN() {
  if (setupMode) {
    if (!setupPINValue) {
      setupPINValue = currentPIN;
      currentPIN = "";
      updatePINDots();
      document.getElementById('lock-title').textContent = "Dobaara PIN Daalein";
    } else {
      if (currentPIN === setupPINValue) {
        SEC.pin = currentPIN;
        saveSec();
        showToast("PIN set ho gaya! 🔒", "success");
        hideLockScreen();
      } else {
        showToast("PIN match nahi hua!", "error");
        currentPIN = "";
        setupPINValue = null;
        updatePINDots();
        document.getElementById('lock-title').textContent = "Naya 4-Digit PIN Daalein";
      }
    }
  } else {
    if (currentPIN === SEC.pin) {
      hideLockScreen();
    } else {
      showToast("Ghalat PIN!", "error");
      currentPIN = "";
      updatePINDots();
    }
  }
}

function hideLockScreen() {
  document.getElementById('app-lock-screen').classList.add('hidden');
  currentPIN = "";
  setupMode = false;
  setupPINValue = null;
  updatePINDots();
  renderSettingsScreen();
}

function setupPIN() {
  if (SEC.pin) {
    if (confirm("Purana PIN aur Fingerprint data hatana chahte hain?")) {
      SEC.pin = null;
      SEC.bio = false;
      SEC.credentialId = null;
      saveSec();
      renderSettingsScreen();
      showToast("App Lock hat gaya", "error");
    }
    return;
  }
  setupMode = true;
  setupPINValue = null;
  currentPIN = "";
  updatePINDots();
  document.getElementById('lock-title').textContent = "Naya 4-Digit PIN Daalein";
  document.getElementById('app-lock-screen').classList.remove('hidden');
}

function renderSettingsScreen() {
  const pinText = document.getElementById('sec-pin-text');
  const pinBtn = document.getElementById('sec-pin-btn');
  const bioBtn = document.getElementById('sec-bio-btn');
  
  if (!pinText) return;

  if (SEC.pin) {
    pinText.textContent = "PIN Laga Hua Hai";
    pinBtn.textContent = "Hatao";
    pinBtn.className = "btn btn-red";
  } else {
    pinText.textContent = "4-Digit PIN Set Karein";
    pinBtn.textContent = "Setup";
    pinBtn.className = "btn btn-outline";
  }

  if (SEC.bio) {
    bioBtn.textContent = "Disable";
    bioBtn.className = "btn btn-red";
  } else {
    bioBtn.textContent = "Enable";
    bioBtn.className = "btn btn-outline";
  }
}

function toggleBiometric() {
  if (!SEC.pin) return showToast("Pehle PIN set karein!", "error");
  
  if (SEC.bio) {
    SEC.bio = false;
    SEC.credentialId = null;
    saveSec();
    renderSettingsScreen();
    return showToast("Biometric band ho gaya", "error");
  }

  if (!window.PublicKeyCredential) {
    return showToast("Aapka browser Fingerprint support nahi karta (Offline restrictions).", "error");
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  let hostname = window.location.hostname;
  if (!hostname || hostname === '') hostname = 'localhost'; // Fallback for file://

  navigator.credentials.create({
    publicKey: {
      challenge: challenge,
      rp: { name: "HisabKitab PWA", id: hostname },
      user: { id: userId, name: "owner", displayName: "Owner" },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
      authenticatorSelection: { userVerification: "required" },
      timeout: 60000
    }
  }).then(cred => {
    SEC.bio = true;
    SEC.credentialId = Array.from(new Uint8Array(cred.rawId));
    saveSec();
    renderSettingsScreen();
    showToast("Fingerprint Setup Successful! 👆", "success");
  }).catch(e => {
    console.error(e);
    showToast("Biometric setup fail: " + e.message, "error");
  });
}

function tryBiometric() {
  if (!SEC.bio || !SEC.credentialId || !window.PublicKeyCredential) return;

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  
  let hostname = window.location.hostname;
  if (!hostname || hostname === '') hostname = 'localhost';

  navigator.credentials.get({
    publicKey: {
      challenge: challenge,
      rpId: hostname,
      allowCredentials: [{
        type: 'public-key',
        id: new Uint8Array(SEC.credentialId)
      }],
      userVerification: "required",
      timeout: 60000
    }
  }).then(() => {
    showToast("Biometric Unlocked! 🔓", "success");
    hideLockScreen();
  }).catch(e => {
    console.error(e);
    // User can just use PIN if biometric fails/cancels
  });
}

function initSecurity() {
  renderSettingsScreen();
  if (SEC.pin) {
    document.getElementById('app-lock-screen').classList.remove('hidden');
    document.getElementById('lock-title').textContent = "PIN Daalein";
    if (SEC.bio) {
      setTimeout(tryBiometric, 500);
    }
  }
}

// ========================
// PWA SETUP
// ========================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// ========================
// SCROLL LOGIC
// ========================
let isScrolledDown = false;
window.addEventListener('scroll', () => {
  const fab = document.getElementById('smart-scroll-fab');
  if (!fab) return;

  if (window.scrollY > 200) {
    if (!isScrolledDown) {
      fab.classList.add('is-up');
      isScrolledDown = true;
    }
  } else {
    if (isScrolledDown) {
      fab.classList.remove('is-up');
      isScrolledDown = false;
    }
  }
});

function handleSmartScroll() {
  if (isScrolledDown) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}

// ========================
// INIT
// ========================
document.addEventListener("DOMContentLoaded", () => {
  initSecurity();
  updateThemeIcon(savedTheme);
  document.getElementById('att-date').value = today();
  setThisMonth();
  renderDashboard();
});
