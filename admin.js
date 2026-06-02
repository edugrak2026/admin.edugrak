// Admin Panel Logic
const API_URL = "https://database-edugrak.vercel.app/api";
let appData = null;

// Auth Logic
const loginOverlay = document.getElementById('login-overlay');
const adminContent = document.getElementById('admin-content');
const loginFormAdmin = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

function checkAuth() {
    const isAdmin = sessionStorage.getItem('isAdminLoggedIn');
    if (isAdmin === 'true') {
        if (loginOverlay) loginOverlay.classList.add('hidden');
        if (adminContent) adminContent.classList.remove('hidden');
        initAppData();
    } else {
        if (loginOverlay) loginOverlay.classList.remove('hidden');
        if (adminContent) adminContent.classList.add('hidden');
    }
}

if (loginFormAdmin) {
    loginFormAdmin.onsubmit = (e) => {
        e.preventDefault();
        const user = document.getElementById('admin-username').value;
        const pass = document.getElementById('admin-password').value;

        if (user === 'Fawwaz Parsa' && pass === 'Gibran Rafan 190') {
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            checkAuth();
        } else {
            loginError.classList.remove('hidden');
            setTimeout(() => loginError.classList.add('hidden'), 3000);
        }
    };
}

function adminLogout() {
    sessionStorage.removeItem('isAdminLoggedIn');
    window.location.reload();
}

async function initAppData() {
    try {
        const response = await fetch(`${API_URL}/appdata`);
        appData = await response.json();
        if (!appData || Object.keys(appData).length < 5) {
            alert("Data aplikasi di server masih kosong. Silakan buka website utama terlebih dahulu untuk inisialisasi.");
            window.location.href = 'index.html';
            return;
        }
        init();
    } catch (err) {
        console.error('Error loading AppData from server:', err);
        appData = JSON.parse(localStorage.getItem('edugrakAppData'));
        if (!appData) {
            alert("Gagal terhubung ke server dan data lokal tidak ditemukan.");
            window.location.href = 'index.html';
            return;
        }
        init();
    }
}

checkAuth();

// State
let currentTab = 'dashboard';
let editingId = null;
let currentModalType = null;
let latihanState = { level: 1, type: null, subtes: null, package: null };

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const modalOverlay = document.getElementById('modal-overlay');
const modalBox = document.getElementById('modal-box');
const adminForm = document.getElementById('admin-form');
const modalTitle = document.getElementById('modal-title');
const latihanContainer = document.getElementById('latihan-admin-container');
const latihanBreadcrumb = document.getElementById('latihan-breadcrumb');
const latihanActions = document.getElementById('latihan-actions');
const btnAddLatihan = document.getElementById('btn-add-latihan-item');

// Initialize
function init() {
    renderDashboard();
    setupEventListeners();
}

function setupEventListeners() {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuToggle && overlay) {
        menuToggle.onclick = () => {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        };
        overlay.onclick = () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        };
    }

    navBtns.forEach(btn => {
        btn.onclick = () => {
            const tab = btn.getAttribute('data-tab');
            switchTab(tab);
            // Close sidebar on mobile after clicking
            if (window.innerWidth < 768) {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        };
    });

    adminForm.onsubmit = (e) => {
        e.preventDefault();
        handleSave();
    };

    document.getElementById('btn-save').onclick = () => adminForm.requestSubmit();
}

function switchTab(tab) {
    currentTab = tab;
    navBtns.forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-tab') === tab) b.classList.add('active');
    });

    tabContents.forEach(c => {
        c.classList.add('hidden');
        if (c.id === `tab-${tab}`) c.classList.remove('hidden');
    });

    // Render data based on tab
    if (tab === 'dashboard') renderDashboard();
    if (tab === 'users') renderUsers();
    if (tab === 'materi') renderMateri();
    if (tab === 'latihan') renderLatihanLevel1();
    if (tab === 'subtes') renderSubtes();
    if (tab === 'irt') renderIRT();
    if (tab === 'premium') renderPremium();
}

// --- PREMIUM MANAGEMENT ---

function renderPremium() {
    const packagesBody = document.getElementById('premium-packages-body');
    const couponsBody = document.getElementById('coupons-body');
    
    // Packages
    const packages = appData.premiumPackages || [];
    packagesBody.innerHTML = packages.map(pkg => `
        <tr>
            <td class="p-5">
                <p class="font-black text-gray-900 text-sm">${pkg.name}</p>
                <p class="text-[10px] text-gray-400 font-bold uppercase">${pkg.duration} Hari</p>
            </td>
            <td class="p-5 font-black text-gray-900 text-sm">Rp ${pkg.price.toLocaleString('id-ID')}</td>
            <td class="p-5 text-right">
                <button onclick="editingId='${pkg.id}'; openModal('premium-package')" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                <button onclick="deletePremiumPackage('${pkg.id}')" class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all ml-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </td>
        </tr>
    `).join('');

    // Coupons
    const coupons = appData.coupons || [];
    couponsBody.innerHTML = coupons.map(c => `
        <tr>
            <td class="p-5">
                <p class="font-black text-gray-900 text-sm">${c.code}</p>
                <p class="text-[10px] ${c.isActive ? 'text-emerald-500' : 'text-rose-500'} font-bold uppercase">${c.isActive ? 'Aktif' : 'Nonaktif'}</p>
            </td>
            <td class="p-5 font-black text-gray-900 text-sm">${c.type === 'percentage' ? c.value + '%' : 'Rp ' + c.value.toLocaleString('id-ID')}</td>
            <td class="p-5 text-right">
                <button onclick="editingId='${c.id}'; openModal('coupon')" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                <button onclick="deleteCoupon('${c.id}')" class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all ml-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </td>
        </tr>
    `).join('');
}

function deletePremiumPackage(id) {
    if (confirm("Hapus paket premium ini?")) {
        appData.premiumPackages = appData.premiumPackages.filter(p => p.id !== id);
        saveData();
        renderPremium();
    }
}

function deleteCoupon(id) {
    if (confirm("Hapus kupon ini?")) {
        appData.coupons = appData.coupons.filter(c => c.id !== id);
        saveData();
        renderPremium();
    }
}

// --- LATIHAN DRILL-DOWN FUNCTIONS ---

function updateLatihanBreadcrumb() {
    let html = `<button onclick="renderLatihanLevel1()" class="hover:text-emerald-600 transition-colors">Bank Soal</button>`;
    if (latihanState.level >= 2) {
        html += `<span> / </span><button onclick="renderLatihanLevel2('${latihanState.type}')" class="hover:text-emerald-600 transition-colors">${latihanState.type}</button>`;
    }
    if (latihanState.level >= 3) {
        const name = latihanState.type === 'Arena TO' ? latihanState.package : latihanState.subtes;
        html += `<span> / </span><button onclick="renderLatihanLevel3('${latihanState.type}', '${latihanState.subtes}', '${latihanState.package}')" class="hover:text-emerald-600 transition-colors">${name}</button>`;
    }
    if (latihanState.level >= 4) {
        const name = latihanState.type === 'Arena TO' ? latihanState.subtes : latihanState.package;
        html += `<span> / </span><span class="text-emerald-600">${name}</span>`;
    }
    latihanBreadcrumb.innerHTML = html;
}

function renderLatihanLevel1() {
    latihanState = { level: 1, type: null, subtes: null, package: null };
    updateLatihanBreadcrumb();
    latihanActions.classList.add('hidden');
    
    const exerciseTypes = Object.keys(appData.questionsBank);
    const defaultIcons = { 'Bedah Materi': '📖', 'Soal Paket': '📝', 'Kuis Kilat': '⚡', 'Arena TO': '🏆' };
    const defaultDescs = { 
        'Bedah Materi': 'Latihan mendalam per topik materi.', 
        'Soal Paket': 'Simulasi ujian dengan paket soal lengkap.', 
        'Kuis Kilat': 'Uji kecepatan dengan kuis singkat.', 
        'Arena TO': 'Tryout Nasional Akbar.' 
    };

    latihanContainer.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-black text-gray-900">Jenis Latihan</h2>
            <button onclick="editingId = null; openModal('exercise-type')" class="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center">
                <span class="mr-2">+</span> Jenis Latihan
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${exerciseTypes.map(t => {
                const config = appData.exerciseConfigs?.[t] || { icon: defaultIcons[t] || '🎯', desc: defaultDescs[t] || 'Latihan soal interaktif.', isPremium: false };
                return `
                <div onclick="renderLatihanLevel2('${t}')" class="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all cursor-pointer group relative">
                    <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        ${config.icon}
                    </div>
                    <h3 class="text-xl font-black text-gray-900 mb-2">${t}</h3>
                    <p class="text-gray-400 text-xs font-medium">${config.desc}</p>
                    ${config.isPremium ? '<div class="mt-4 inline-block px-2 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black rounded-md uppercase">PREMIUM</div>' : ''}
                    
                    <div class="absolute top-4 right-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onclick="event.stopPropagation(); editingId='${t}'; openModal('exercise-type', ${JSON.stringify({name: t, ...config}).replace(/"/g, '&quot;')})" class="p-2 text-emerald-400 hover:text-emerald-600 transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="event.stopPropagation(); deleteExerciseType('${t}')" class="p-2 text-rose-400 hover:text-rose-600 transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            `;}).join('')}
        </div>
    `;
}

function deleteExerciseType(type) {
    if (['Bedah Materi', 'Soal Paket', 'Kuis Kilat', 'Arena TO'].includes(type)) {
        alert("Jenis latihan bawaan tidak dapat dihapus.");
        return;
    }
    if (confirm(`Hapus jenis latihan "${type}"? Semua data soal di dalamnya akan hilang.`)) {
        delete appData.questionsBank[type];
        delete appData.latihanDetails[type];
        if (appData.exerciseConfigs) delete appData.exerciseConfigs[type];
        saveData();
        renderLatihanLevel1();
    }
}

function renderLatihanLevel2(type) {
    latihanState = { level: 2, type, subtes: null, package: null };
    updateLatihanBreadcrumb();
    
    if (type === 'Arena TO') {
        // Level 2 for Arena TO: List of TO Packages
        latihanActions.classList.remove('hidden');
        btnAddLatihan.onclick = () => { editingId = null; openModal('to-package'); };
        
        const packages = Object.keys(appData.questionsBank['Arena TO'] || {});
        latihanContainer.innerHTML = `
            <div class="space-y-4 mt-4">
                <h2 class="text-2xl font-black text-gray-900">Daftar Paket Tryout</h2>
                <div class="grid grid-cols-1 gap-4">
                    ${packages.length > 0 ? packages.map(p => {
                        const detail = appData.latihanDetails['Arena TO']?.['all']?.find(d => d.name === p) || { duration: 0, status: 'Published', startDate: '', endDate: '', description: '' };
                        
                        // Calculate status
                        let statusLabel = "Sedang Berlangsung";
                        let statusClass = "bg-emerald-100 text-emerald-600";
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        
                        if (detail.startDate && detail.endDate) {
                            const start = new Date(detail.startDate);
                            const end = new Date(detail.endDate);
                            start.setHours(0, 0, 0, 0);
                            end.setHours(23, 59, 59, 999);
                            
                            if (now < start) {
                                statusLabel = "Akan Datang";
                                statusClass = "bg-gray-100 text-gray-400";
                            } else if (now > end) {
                                statusLabel = "Sudah Berakhir";
                                statusClass = "bg-gray-100 text-gray-400";
                            }
                        }

                        return `
                        <div class="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between hover:border-emerald-200 transition-all group gap-4 ${statusLabel !== 'Sedang Berlangsung' ? 'opacity-70' : ''}">
                            <div onclick="renderLatihanLevel3('Arena TO', null, '${p}')" class="flex items-center space-x-4 flex-1 cursor-pointer">
                                <div class="w-14 h-14 ${statusLabel === 'Sedang Berlangsung' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'} rounded-2xl flex items-center justify-center text-xl font-bold transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                    🏆
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <h4 class="font-bold text-gray-900 truncate">${p}</h4>
                                        <span class="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${statusClass}">${statusLabel}</span>
                                        <button onclick="event.stopPropagation(); togglePackageStatus('Arena TO', 'all', '${p}')" class="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${detail.status === 'Published' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}">
                                            ${detail.status}
                                        </button>
                                    </div>
                                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                        ⏱️ ${detail.durationText || '3 Jam 5 Menit'} • 📅 ${detail.startDate || '?'} - ${detail.endDate || '?'}
                                    </p>
                                    <p class="text-[10px] text-gray-500 mt-1 truncate max-w-md">${detail.description || 'Tidak ada deskripsi.'}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 self-end md:self-center">
                                <button onclick="editPackage('Arena TO', 'all', '${p}')" class="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </button>
                                <button onclick="deletePackage('Arena TO', 'all', '${p}')" class="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                                <div class="hidden md:block">
                                    <svg class="w-6 h-6 text-gray-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        </div>
                    `;}).join('') : '<div class="p-10 text-center text-gray-400 font-medium bg-gray-50 rounded-3xl border border-dashed border-gray-200">Belum ada paket TO.</div>'}
                </div>
            </div>
        `;
    } else {
        // Level 2 for Others: Select Subtest
        latihanActions.classList.add('hidden');
        latihanContainer.innerHTML = `
            <div class="space-y-6 mt-4">
                <h2 class="text-2xl font-black text-gray-900">Pilih Subtes</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    ${appData.subtesData.map(s => `
                        <div onclick="renderLatihanLevel3('${type}', '${s.id}', null)" class="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all cursor-pointer group text-center">
                            <div class="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                ${s.icon}
                            </div>
                            <h3 class="font-black text-gray-900 text-sm">${s.name}</h3>
                            <p class="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">${s.id}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

function renderLatihanLevel3(type, subtes, packageName) {
    latihanState = { level: 3, type, subtes, package: packageName };
    updateLatihanBreadcrumb();

    if (type === 'Arena TO') {
        // Level 3 for Arena TO: Select Subtest within TO Package
        latihanActions.classList.add('hidden');
        latihanContainer.innerHTML = `
            <div class="space-y-6 mt-4">
                <h2 class="text-2xl font-black text-gray-900">Subtes dalam ${packageName}</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    ${appData.subtesData.map(s => `
                        <div onclick="renderLatihanLevel4('${type}', '${s.id}', '${packageName}')" class="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all cursor-pointer group text-center">
                            <div class="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                ${s.icon}
                            </div>
                            <h3 class="font-black text-gray-900 text-sm">${s.name}</h3>
                            <p class="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">${s.id}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        // Level 3 for Others: List of Packages/Topics
        latihanActions.classList.remove('hidden');
        btnAddLatihan.onclick = () => { editingId = null; openModal('latihan-package', { type, subtes }); };

        const packages = Object.keys(appData.questionsBank[type][subtes] || {});
        latihanContainer.innerHTML = `
            <div class="space-y-4 mt-4">
                <h2 class="text-2xl font-black text-gray-900">Daftar Paket/Topik (${subtes})</h2>
                <div class="grid grid-cols-1 gap-4">
                    ${packages.length > 0 ? packages.map(p => {
                        const detail = appData.latihanDetails[type]?.[subtes]?.find(d => d.name === p) || { duration: 0, status: 'Published' };
                        return `
                        <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between hover:border-emerald-200 transition-all group gap-4">
                            <div onclick="renderLatihanLevel4('${type}', '${subtes}', '${p}')" class="flex items-center space-x-4 flex-1 cursor-pointer">
                                <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">#</div>
                                <div class="flex-1">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <h4 class="font-bold text-gray-900">${p}</h4>
                                        <button onclick="event.stopPropagation(); togglePackageStatus('${type}', '${subtes}', '${p}')" class="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${detail.status === 'Published' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}">
                                            ${detail.status}
                                        </button>
                                    </div>
                                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">⏱️ ${detail.duration} Detik • ${type}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 self-end md:self-center">
                                <button onclick="editPackage('${type}', '${subtes}', '${p}')" class="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </button>
                                <button onclick="deletePackage('${type}', '${subtes}', '${p}')" class="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                                <div class="hidden md:block">
                                    <svg class="w-6 h-6 text-gray-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        </div>
                    `;}).join('') : '<div class="p-10 text-center text-gray-400 font-medium bg-gray-50 rounded-3xl border border-dashed border-gray-200">Belum ada paket/topik.</div>'}
                </div>
            </div>
        `;
    }
}

function renderLatihanLevel4(type, subtes, packageName) {
    latihanState = { level: 4, type, subtes, package: packageName };
    updateLatihanBreadcrumb();

    latihanActions.classList.remove('hidden');
    btnAddLatihan.onclick = () => { editingId = null; openModal('soal', { type, subtes, package: packageName }); };

    const questions = appData.questionsBank[type][packageName] ? appData.questionsBank[type][packageName][subtes] : appData.questionsBank[type][subtes][packageName];
    
    latihanContainer.innerHTML = `
        <div class="space-y-4 mt-4">
            <h2 class="text-2xl font-black text-gray-900">Daftar Soal (${packageName})</h2>
            <div class="grid grid-cols-1 gap-4" id="soal-list-container">
                ${(questions && questions.length > 0) ? questions.map((q, idx) => `
                    <div class="p-6 bg-white rounded-3xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between group gap-4">
                        <div class="flex items-center space-x-4 flex-1 min-w-0">
                            <span class="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center font-black text-xs flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">${idx + 1}</span>
                            <p class="font-bold text-gray-700 truncate">${q.q}</p>
                        </div>
                        <div class="flex items-center space-x-2 self-end md:self-center">
                            <button onclick="editSoal('${type}', '${subtes}', '${packageName}', ${idx})" class="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <button onclick="deleteSoal('${type}', '${subtes}', '${packageName}', ${idx})" class="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                `).join('') : '<div class="p-10 text-center text-gray-400 font-medium bg-gray-50 rounded-3xl border border-dashed border-gray-200">Belum ada soal di paket ini.</div>'}
            </div>
        </div>
    `;
}

// --- RENDERING FUNCTIONS ---

function renderDashboard() {
    document.getElementById('stat-users').innerText = appData.users.length;
    document.getElementById('stat-videos').innerText = appData.videos.length;
    
    let totalSoal = 0;
    Object.keys(appData.questionsBank).forEach(type => {
        Object.keys(appData.questionsBank[type]).forEach(sub => {
            totalSoal += appData.questionsBank[type][sub].length;
        });
    });
    document.getElementById('stat-questions').innerText = totalSoal;
    document.getElementById('stat-subtes').innerText = appData.subtesData.length;
}

function renderUsers() {
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = '';
    
    appData.users.forEach((user, idx) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors";
        tr.innerHTML = `
            <td class="p-6">
                <div class="flex items-center space-x-3">
                    <img src="${user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}" class="w-10 h-10 rounded-xl">
                    <span class="font-bold text-gray-900">${user.name}</span>
                </div>
            </td>
            <td class="p-6 text-gray-500 font-medium">${user.email}</td>
            <td class="p-6 text-gray-400 text-sm font-medium">${new Date(user.joinedAt).toLocaleDateString('id-ID')}</td>
            <td class="p-6 text-right">
                <button onclick="deleteUser('${user.email}')" class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMateri() {
    const list = document.getElementById('materi-list');
    list.innerHTML = '';

    appData.videos.forEach(v => {
        const videoId = v.url.split('v=')[1];
        const div = document.createElement('div');
        div.className = "bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 group hover:border-emerald-200 transition-all overflow-hidden";
        div.innerHTML = `
            <div class="w-full sm:w-40 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 relative">
                <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute bottom-2 right-2 bg-black/70 text-white text-[8px] font-bold px-2 py-0.5 rounded">${v.duration}</div>
            </div>
            <div class="flex-1 min-w-0 flex flex-col">
                <div class="flex items-start justify-between">
                    <div class="min-w-0 pr-2">
                        <span class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">${v.subject}</span>
                        <h4 class="font-bold text-gray-900 mt-1 truncate block">${v.title}</h4>
                    </div>
                    <div class="flex space-x-1 flex-shrink-0">
                        <button onclick="editMateri(${v.id})" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deleteMateri(${v.id})" class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
                <p class="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">${v.description}</p>
            </div>
        `;
        list.appendChild(div);
    });
}

function deleteMateri(id) {
    if (confirm("Hapus materi video ini?")) {
        appData.videos = appData.videos.filter(v => v.id !== id);
        saveData();
        renderMateri();
        showNotif("Video berhasil dihapus.");
    }
}

function renderSubtes() {
    const list = document.getElementById('subtes-list');
    list.innerHTML = '';

    appData.subtesData.forEach(s => {
        const div = document.createElement('div');
        div.className = "bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group text-center";
        div.innerHTML = `
            <div class="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                ${s.icon}
            </div>
            <h3 class="font-black text-gray-900 text-lg">${s.name}</h3>
            <p class="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">${s.id} • Warna: ${s.color}</p>
            
            <div class="flex justify-center space-x-2 mt-6">
                <button onclick="editSubtest('${s.id}')" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button onclick="deleteSubtest('${s.id}')" class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `;
        list.appendChild(div);
    });
}

function renderIRT() {
    const tbody = document.getElementById('irt-settings-body');
    tbody.innerHTML = '';

    if (!appData.irtConfigs) appData.irtConfigs = {};

    appData.subtesData.forEach(s => {
        const config = appData.irtConfigs[s.id] || { min: 200, max: 800 };
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors";
        tr.innerHTML = `
            <td class="p-6">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl">${s.icon}</div>
                    <div>
                        <p class="font-bold text-gray-900">${s.name}</p>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${s.id}</p>
                    </div>
                </div>
            </td>
            <td class="p-6">
                <input type="number" id="irt-min-${s.id}" value="${config.min}" class="w-32 px-4 py-2 bg-gray-50 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-gray-700 transition-all">
            </td>
            <td class="p-6">
                <input type="number" id="irt-max-${s.id}" value="${config.max}" class="w-32 px-4 py-2 bg-gray-50 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-gray-700 transition-all">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function saveIRTSettings() {
    if (!appData.irtConfigs) appData.irtConfigs = {};

    appData.subtesData.forEach(s => {
        const minVal = parseInt(document.getElementById(`irt-min-${s.id}`).value);
        const maxVal = parseInt(document.getElementById(`irt-max-${s.id}`).value);

        if (isNaN(minVal) || isNaN(maxVal)) {
            showNotif("Harap masukkan angka yang valid.", "error");
            return;
        }

        if (minVal >= maxVal) {
            showNotif(`Skor minimum ${s.id} harus lebih kecil dari maksimum.`, "error");
            return;
        }

        appData.irtConfigs[s.id] = { min: minVal, max: maxVal };
    });

    saveData();
    showNotif("Konfigurasi IRT berhasil disimpan!");
}

function renderSubtesOptions() {
    const filter = document.getElementById('filter-subtes');
    const currentVal = filter.value;
    filter.innerHTML = appData.subtesData.map(s => `<option value="${s.id}" ${currentVal === s.id ? 'selected' : ''}>${s.name} (${s.id})</option>`).join('');
    // Add 'all' for Arena TO
    if (document.getElementById('filter-latihan-type').value === 'Arena TO') {
        filter.innerHTML = '<option value="all">Semua Subtes (all)</option>' + filter.innerHTML;
    }
}

// --- MODAL FUNCTIONS ---

function openModal(type, extra = null) {
    currentModalType = type;
    modalTitle.innerText = `Tambah ${type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    adminForm.innerHTML = '';

    if (type === 'materi') {
        const v = editingId !== null ? appData.videos.find(x => x.id === editingId) : { title: '', subject: '', duration: '', url: '', description: '' };
        adminForm.innerHTML = `
            <div class="grid grid-cols-2 gap-6">
                <div class="col-span-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Judul Video</label>
                    <input type="text" name="title" value="${v.title}" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Subjek</label>
                    <select name="subject" class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                        ${appData.subtesData.map(s => `<option value="${s.id}" ${v.subject === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Durasi</label>
                    <input type="text" name="duration" value="${v.duration}" placeholder="Contoh: 15:20" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">URL YouTube</label>
                    <input type="url" name="url" value="${v.url}" placeholder="https://www.youtube.com/watch?v=..." required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Deskripsi</label>
                    <textarea name="description" rows="3" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">${v.description}</textarea>
                </div>
            </div>
        `;
    } else if (type === 'soal') {
        const { type: lType, subtes, package: pkg } = extra;
        const qData = editingId !== null ? (lType === 'Arena TO' ? appData.questionsBank[lType][pkg][subtes][editingId] : appData.questionsBank[lType][subtes][pkg][editingId]) : { q: '', type: 'mc', image: '', correct: 0, explain: '', a: ['', '', '', ''] };
        
        adminForm.innerHTML = `
            <input type="hidden" name="lType" value="${lType}">
            <input type="hidden" name="subtes" value="${subtes}">
            <input type="hidden" name="package" value="${pkg}">
            <div class="grid grid-cols-2 gap-6">
                <div class="col-span-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Tipe Soal</label>
                    <select name="type" onchange="toggleSoalFields(this.value)" class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                        <option value="mc" ${qData.type === 'mc' ? 'selected' : ''}>Pilihan Ganda</option>
                        <option value="essay" ${qData.type === 'essay' ? 'selected' : ''}>Essay (Jawaban Singkat)</option>
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Pertanyaan</label>
                    <textarea name="q" rows="2" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">${qData.q}</textarea>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Gambar Soal (Opsional)</label>
                    <div class="flex items-center space-x-4">
                        <label class="flex-1 flex items-center justify-center px-6 py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 hover:border-emerald-300 transition-all group">
                            <div class="flex items-center space-x-3">
                                <svg class="w-6 h-6 text-gray-400 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span id="file-label" class="text-sm font-bold text-gray-500 group-hover:text-emerald-600">${qData.image ? 'Ganti Gambar' : 'Pilih File Gambar...'}</span>
                            </div>
                            <input type="file" name="imageFile" accept="image/*" onchange="previewImage(this)" class="hidden">
                        </label>
                        ${qData.image ? `<div id="image-preview-container" class="w-20 h-20 rounded-xl overflow-hidden border border-gray-100"><img src="${qData.image}" class="w-full h-full object-cover"></div>` : '<div id="image-preview-container" class="hidden w-20 h-20 rounded-xl overflow-hidden border border-gray-100"></div>'}
                        <input type="hidden" name="image" id="image-base64" value="${qData.image || ''}">
                    </div>
                </div>
                <div id="mc-fields" class="col-span-2 space-y-4 ${qData.type === 'essay' ? 'hidden' : ''}">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Pilihan Jawaban (A-D)</label>
                    <div class="grid grid-cols-2 gap-4">
                        <input type="text" name="a0" value="${qData.a?.[0] || ''}" placeholder="Opsi A" class="px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                        <input type="text" name="a1" value="${qData.a?.[1] || ''}" placeholder="Opsi B" class="px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                        <input type="text" name="a2" value="${qData.a?.[2] || ''}" placeholder="Opsi C" class="px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                        <input type="text" name="a3" value="${qData.a?.[3] || ''}" placeholder="Opsi D" class="px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                    </div>
                </div>
                <div id="correct-field">
                    <label id="correct-label" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">${qData.type === 'essay' ? 'Jawaban Benar (Ketik Sesuai)' : 'Jawaban Benar'}</label>
                    <div id="correct-input-container">
                        ${qData.type === 'essay' ? 
                            `<input type="text" name="correct" value="${qData.correct}" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">` :
                            `<select name="correct" class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                                <option value="0" ${qData.correct == 0 ? 'selected' : ''}>Opsi A</option>
                                <option value="1" ${qData.correct == 1 ? 'selected' : ''}>Opsi B</option>
                                <option value="2" ${qData.correct == 2 ? 'selected' : ''}>Opsi C</option>
                                <option value="3" ${qData.correct == 3 ? 'selected' : ''}>Opsi D</option>
                            </select>`
                        }
                    </div>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Pembahasan</label>
                    <textarea name="explain" rows="2" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">${qData.explain}</textarea>
                </div>
            </div>
        `;
    } else if (type === 'to-package') {
        const pkgData = editingId !== null ? extra : { name: '', status: 'Draft', startDate: '', endDate: '', description: '', durationText: '', subtestDurations: {} };
        
        const subtestInputs = appData.subtesData.map(s => `
            <div class="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-gray-100">
                <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg">${s.icon}</div>
                <div class="flex-1">
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${s.id}</p>
                    <p class="text-xs font-bold text-gray-900">${s.name}</p>
                </div>
                <div class="w-32">
                    <input type="number" name="sub_dur_${s.id}" value="${pkgData.subtestDurations?.[s.id] || 0}" placeholder="Menit" class="w-full px-4 py-2 bg-gray-50 rounded-xl border-none outline-none font-bold text-sm">
                </div>
            </div>
        `).join('');

        adminForm.innerHTML = `
            <div class="space-y-6">
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Nama Paket Tryout</label>
                    <input type="text" name="packageName" value="${pkgData.name}" placeholder="Contoh: Tryout Nasional #1" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Tanggal Mulai</label>
                        <input type="date" name="startDate" value="${pkgData.startDate || ''}" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                    </div>
                    <div>
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Tanggal Berakhir</label>
                        <input type="date" name="endDate" value="${pkgData.endDate || ''}" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Deskripsi Tryout</label>
                    <textarea name="description" rows="2" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold" placeholder="Sesuai standar terbaru BPPP dengan sistem penilaian IRT.">${pkgData.description || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Keterangan Durasi (Teks)</label>
                    <input type="text" name="durationText" value="${pkgData.durationText || ''}" placeholder="Contoh: 3 Jam 5 Menit" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Durasi Per Subtes (Menit)</label>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        ${subtestInputs}
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Status</label>
                    <select name="status" class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                        <option value="Draft" ${pkgData.status === 'Draft' ? 'selected' : ''}>Draft</option>
                        <option value="Published" ${pkgData.status === 'Published' ? 'selected' : ''}>Published</option>
                    </select>
                </div>
                <div>
                    <label class="flex items-center space-x-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-all">
                        <input type="checkbox" name="isPremium" value="true" ${pkgData.isPremium ? 'checked' : ''} class="w-6 h-6 rounded border-amber-300 text-amber-600 focus:ring-amber-500">
                        <div>
                            <p class="text-sm font-black text-amber-900">Jadikan Paket Premium</p>
                            <p class="text-[10px] font-bold text-amber-600 uppercase">Hanya member premium yang bisa mengerjakan paket ini</p>
                        </div>
                    </label>
                </div>
            </div>
        `;
    } else if (type === 'latihan-package') {
        const { lType, subtes, pkgData } = extra;
        const p = pkgData || { name: '', duration: 0, status: 'Published', isPremium: false };
        adminForm.innerHTML = `
            <input type="hidden" name="lType" value="${lType}">
            <input type="hidden" name="subtes" value="${subtes}">
            <input type="hidden" name="oldPackageName" value="${p.name}">
            <div class="space-y-6">
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Nama Paket/Topik</label>
                    <input type="text" name="packageName" value="${p.name}" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Durasi (Detik)</label>
                    <input type="number" name="duration" value="${p.duration}" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Status</label>
                    <select name="status" class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                        <option value="Published" ${p.status === 'Published' ? 'selected' : ''}>Published</option>
                        <option value="Draft" ${p.status === 'Draft' ? 'selected' : ''}>Draft</option>
                    </select>
                </div>
                <div>
                    <label class="flex items-center space-x-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-all">
                        <input type="checkbox" name="isPremium" value="true" ${p.isPremium ? 'checked' : ''} class="w-6 h-6 rounded border-amber-300 text-amber-600 focus:ring-amber-500">
                        <div>
                            <p class="text-sm font-black text-amber-900">Jadikan Paket Premium</p>
                            <p class="text-[10px] font-bold text-amber-600 uppercase">Hanya member premium yang bisa mengerjakan paket ini</p>
                        </div>
                    </label>
                </div>
            </div>
        `;
    } else if (type === 'subtes') {
        const sData = extra || { id: '', name: '', icon: '', color: 'emerald' };
        adminForm.innerHTML = `
            <input type="hidden" name="oldId" value="${sData.id}">
            <div class="grid grid-cols-2 gap-6">
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">ID Subtes (Singkatan)</label>
                    <input type="text" name="id" value="${sData.id}" placeholder="Contoh: PBM" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Ikon (Emoji)</label>
                    <input type="text" name="icon" value="${sData.icon}" placeholder="📚" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-center">
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Nama Lengkap Subtes</label>
                    <input type="text" name="name" value="${sData.name}" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Warna (Tailwind)</label>
                    <select name="color" class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                        <option value="emerald" ${sData.color === 'emerald' ? 'selected' : ''}>Emerald</option>
                        <option value="rose" ${sData.color === 'rose' ? 'selected' : ''}>Rose</option>
                        <option value="amber" ${sData.color === 'amber' ? 'selected' : ''}>Amber</option>
                        <option value="indigo" ${sData.color === 'indigo' ? 'selected' : ''}>Indigo</option>
                        <option value="cyan" ${sData.color === 'cyan' ? 'selected' : ''}>Cyan</option>
                    </select>
                </div>
            </div>
        `;
    } else if (type === 'exercise-type') {
        const config = extra || { name: '', icon: '🎯', desc: '', isPremium: false };
        adminForm.innerHTML = `
            <div class="space-y-6">
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Nama Jenis Latihan</label>
                    <input type="text" name="name" value="${config.name}" placeholder="Contoh: Simulasi Mandiri" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Ikon (Emoji)</label>
                    <input type="text" name="icon" value="${config.icon}" placeholder="🎯" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Deskripsi Singkat</label>
                    <input type="text" name="desc" value="${config.desc}" placeholder="Deskripsi untuk kartu di dashboard" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div>
                    <label class="flex items-center space-x-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-all">
                        <input type="checkbox" name="isPremium" value="true" ${config.isPremium ? 'checked' : ''} class="w-6 h-6 rounded border-amber-300 text-amber-600 focus:ring-amber-500">
                        <div>
                            <p class="text-sm font-black text-amber-900">Jadikan Jenis Latihan Premium</p>
                            <p class="text-[10px] font-bold text-amber-600 uppercase">Seluruh paket di kategori ini hanya untuk member premium</p>
                        </div>
                    </label>
                </div>
            </div>
        `;
    } else if (type === 'premium-package') {
        const p = editingId ? appData.premiumPackages.find(x => x.id === editingId) : { name: '', price: 0, duration: 30, description: '', features: [] };
        const availableFeatures = [
            { id: 'all_soal', label: 'Akses Semua Bank Soal' },
            { id: 'answer_keys', label: 'Lihat Kunci Jawaban & Pembahasan' },
            { id: 'irt_analysis', label: 'Analisis IRT Real-time' },
            { id: 'certificates', label: 'Sertifikat Tryout Nasional' },
            { id: 'premium_videos', label: 'Video Materi Eksklusif' }
        ];

        const featuresHtml = availableFeatures.map(f => `
            <label class="flex items-center space-x-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-emerald-50 transition-all">
                <input type="checkbox" name="features" value="${f.id}" ${(p.features || []).includes(f.id) ? 'checked' : ''} class="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500">
                <span class="text-sm font-bold text-gray-700">${f.label}</span>
            </label>
        `).join('');

        adminForm.innerHTML = `
            <div class="space-y-6">
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Nama Paket</label>
                    <input type="text" name="name" value="${p.name}" placeholder="Contoh: Paket Juara 30 Hari" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Harga (Rp)</label>
                        <input type="number" name="price" value="${p.price}" placeholder="49000" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                    </div>
                    <div>
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Durasi (Hari)</label>
                        <input type="number" name="duration" value="${p.duration}" placeholder="30" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Deskripsi Paket</label>
                    <textarea name="description" rows="2" class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold" placeholder="Apa yang didapat di paket ini?">${p.description || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Pilih Fasilitas Premium</label>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        ${featuresHtml}
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'coupon') {
        const c = editingId ? appData.coupons.find(x => x.id === editingId) : { code: '', type: 'percentage', value: 0, isActive: true };
        adminForm.innerHTML = `
            <div class="space-y-6">
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Kode Kupon</label>
                    <input type="text" name="code" value="${c.code}" placeholder="DISKON77" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold uppercase">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Tipe Potongan</label>
                        <select name="type" class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                            <option value="percentage" ${c.type === 'percentage' ? 'selected' : ''}>Persentase (%)</option>
                            <option value="fixed" ${c.type === 'fixed' ? 'selected' : ''}>Nominal (Rp)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Nilai Potongan</label>
                        <input type="number" name="value" value="${c.value}" placeholder="10" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Status</label>
                    <select name="isActive" class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                        <option value="true" ${c.isActive ? 'selected' : ''}>Aktif</option>
                        <option value="false" ${!c.isActive ? 'selected' : ''}>Nonaktif</option>
                    </select>
                </div>
            </div>
        `;
    }

    modalOverlay.classList.remove('hidden');
    modalOverlay.classList.add('flex');
    setTimeout(() => {
        modalBox.classList.remove('scale-95', 'opacity-0');
        modalBox.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeModal() {
    modalBox.classList.remove('scale-100', 'opacity-100');
    modalBox.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modalOverlay.classList.remove('flex');
        modalOverlay.classList.add('hidden');
    }, 300);
}

// --- DATA ACTIONS ---

async function previewImage(input) {
    if (input.files && input.files[0]) {
        const fileLabel = document.getElementById('file-label');
        const preview = document.getElementById('image-preview-container');
        const imageHiddenInput = document.getElementById('image-base64');
        
        fileLabel.innerText = "Mengupload...";
        preview.classList.remove('hidden');
        preview.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-50"><div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>`;

        const formData = new FormData();
        formData.append('image', input.files[0]);

        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload gagal');

            const data = await response.json();
            imageHiddenInput.value = data.url;
            preview.innerHTML = `<img src="${data.url}" class="w-full h-full object-cover">`;
            fileLabel.innerText = "Upload Berhasil!";
        } catch (err) {
            console.error('Error uploading image:', err);
            fileLabel.innerText = "Upload Gagal!";
            preview.classList.add('hidden');
            alert("Gagal mengupload gambar ke Cloudinary. Silakan coba lagi.");
        }
    }
}

function toggleSoalFields(type) {
    const mcFields = document.getElementById('mc-fields');
    const correctLabel = document.getElementById('correct-label');
    const correctContainer = document.getElementById('correct-input-container');

    if (type === 'essay') {
        mcFields.classList.add('hidden');
        correctLabel.innerText = 'Jawaban Benar (Ketik Sesuai)';
        correctContainer.innerHTML = `<input type="text" name="correct" required class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">`;
    } else {
        mcFields.classList.remove('hidden');
        correctLabel.innerText = 'Jawaban Benar';
        correctContainer.innerHTML = `
            <select name="correct" class="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold">
                <option value="0">Opsi A</option><option value="1">Opsi B</option><option value="2">Opsi C</option><option value="3">Opsi D</option>
            </select>
        `;
    }
}

function handleSave() {
    const formData = new FormData(adminForm);
    const data = Object.fromEntries(formData.entries());

    if (currentModalType === 'materi') {
        if (editingId) {
            const idx = appData.videos.findIndex(v => v.id === editingId);
            appData.videos[idx] = { ...appData.videos[idx], ...data };
        } else {
            appData.videos.push({ id: Date.now(), ...data, tags: [`#${data.subject.toLowerCase()}`, '#utbk'] });
        }
    } else if (currentModalType === 'to-package') {
        const { packageName, status, startDate, endDate, description, durationText, isPremium } = data;
        if (!appData.questionsBank['Arena TO']) appData.questionsBank['Arena TO'] = {};
        
        // Extract subtest durations
        const subtestDurations = {};
        appData.subtesData.forEach(s => {
            const dur = data[`sub_dur_${s.id}`];
            if (dur) subtestDurations[s.id] = parseInt(dur);
        });

        // If editing
        if (editingId && editingId !== packageName) {
            appData.questionsBank['Arena TO'][packageName] = appData.questionsBank['Arena TO'][editingId];
            delete appData.questionsBank['Arena TO'][editingId];
        }

        if (!appData.questionsBank['Arena TO'][packageName]) {
            appData.questionsBank['Arena TO'][packageName] = {};
            appData.subtesData.forEach(s => {
                appData.questionsBank['Arena TO'][packageName][s.id] = [];
            });
        }

        // Update details
        if (!appData.latihanDetails['Arena TO']) appData.latihanDetails['Arena TO'] = { 'all': [] };
        const details = appData.latihanDetails['Arena TO']['all'];
        const existingIdx = details.findIndex(d => d.name === (editingId || packageName));
        const newDetail = { 
            name: packageName, 
            durationText, 
            subtestDurations,
            status,
            startDate,
            endDate,
            description,
            isPremium: isPremium === 'true'
        };
        if (existingIdx >= 0) details[existingIdx] = newDetail;
        else details.push(newDetail);

        saveData();
        renderLatihanLevel2('Arena TO');
    } else if (currentModalType === 'latihan-package') {
        const { lType, subtes, packageName, oldPackageName, duration, status, isPremium } = data;
        if (!appData.questionsBank[lType][subtes]) appData.questionsBank[lType][subtes] = {};
        
        // Handle rename
        if (oldPackageName && oldPackageName !== packageName) {
            appData.questionsBank[lType][subtes][packageName] = appData.questionsBank[lType][subtes][oldPackageName];
            delete appData.questionsBank[lType][subtes][oldPackageName];
        }

        if (!appData.questionsBank[lType][subtes][packageName]) {
            appData.questionsBank[lType][subtes][packageName] = [];
        }

        // Update details
        if (!appData.latihanDetails[lType]) appData.latihanDetails[lType] = {};
        if (!appData.latihanDetails[lType][subtes]) appData.latihanDetails[lType][subtes] = [];
        const details = appData.latihanDetails[lType][subtes];
        const existingIdx = details.findIndex(d => d.name === (oldPackageName || packageName));
        const newDetail = { name: packageName, duration: parseInt(duration), status, isPremium: isPremium === 'true' };
        if (existingIdx >= 0) details[existingIdx] = newDetail;
        else details.push(newDetail);

        saveData();
        renderLatihanLevel3(lType, subtes, null);
    } else if (currentModalType === 'soal') {
        const { lType, subtes, q, type, image, correct, explain, a0, a1, a2, a3 } = data;
        const pkg = data.package; // Avoid reserved word issues if any, though destructuring handled it
        
        const questionObj = { 
            q, 
            type, 
            image: image || '', 
            correct: type === 'essay' ? correct : parseInt(correct), 
            explain, 
            a: type === 'mc' ? [a0, a1, a2, a3] : [] 
        };
        
        let targetArray;
        try {
            if (lType === 'Arena TO') {
                if (!appData.questionsBank[lType][pkg]) appData.questionsBank[lType][pkg] = {};
                if (!appData.questionsBank[lType][pkg][subtes]) appData.questionsBank[lType][pkg][subtes] = [];
                targetArray = appData.questionsBank[lType][pkg][subtes];
            } else {
                if (!appData.questionsBank[lType][subtes]) appData.questionsBank[lType][subtes] = {};
                if (!appData.questionsBank[lType][subtes][pkg]) appData.questionsBank[lType][subtes][pkg] = [];
                targetArray = appData.questionsBank[lType][subtes][pkg];
            }

            if (editingId !== null) {
                targetArray[editingId] = questionObj;
            } else {
                targetArray.push(questionObj);
            }
            saveData();
            renderLatihanLevel4(lType, subtes, pkg);
        } catch (err) {
            console.error("Error saving question:", err);
            alert("Terjadi kesalahan saat menyimpan soal. Pastikan data struktur benar.");
            return;
        }
    } else if (currentModalType === 'subtes') {
        const { id, name, icon, color, oldId } = data;
        const newSubtest = { id, name, icon, color };
        
        if (oldId) {
            const idx = appData.subtesData.findIndex(s => s.id === oldId);
            if (idx !== -1) {
                appData.subtesData[idx] = newSubtest;
            }
        } else {
            appData.subtesData.push(newSubtest);
        }
        
        saveData();
        renderSubtes();
    } else if (currentModalType === 'config-item') {
        const { type, subtes, name, duration } = data;
        if (!appData.latihanDetails[type]) appData.latihanDetails[type] = {};
        if (!appData.latihanDetails[type][subtes]) appData.latihanDetails[type][subtes] = [];
        appData.latihanDetails[type][subtes].push({ name, duration: parseInt(duration) });
    } else if (currentModalType === 'exercise-type') {
        const { name, icon, desc, isPremium } = data;
        if (!appData.questionsBank[name] || editingId) {
            if (!appData.questionsBank[name]) appData.questionsBank[name] = {};
            if (!appData.latihanDetails[name]) appData.latihanDetails[name] = {};
            if (!appData.exerciseConfigs) appData.exerciseConfigs = {};
            appData.exerciseConfigs[name] = { icon, desc, isPremium: isPremium === 'true' };
            saveData();
            renderLatihanLevel1();
        } else {
            alert("Jenis latihan ini sudah ada.");
            return;
        }
    } else if (currentModalType === 'premium-package') {
        const { name, price, duration, description } = data;
        const features = formData.getAll('features');
        const pkgData = { 
            id: editingId || `PKG-${Date.now()}`, 
            name, 
            price: parseInt(price), 
            duration: parseInt(duration),
            description,
            features
        };
        
        if (!appData.premiumPackages) appData.premiumPackages = [];
        if (editingId) {
            const idx = appData.premiumPackages.findIndex(p => p.id === editingId);
            appData.premiumPackages[idx] = pkgData;
        } else {
            appData.premiumPackages.push(pkgData);
        }
        renderPremium();
    } else if (currentModalType === 'coupon') {
        const { code, type, value, isActive } = data;
        const couponData = { 
            id: editingId || `CPN-${Date.now()}`, 
            code: code.toUpperCase(), 
            type, 
            value: parseInt(value), 
            isActive: isActive === 'true' 
        };
        
        if (!appData.coupons) appData.coupons = [];
        if (editingId) {
            const idx = appData.coupons.findIndex(c => c.id === editingId);
            appData.coupons[idx] = couponData;
        } else {
            appData.coupons.push(couponData);
        }
        renderPremium();
    }

    saveData();
    closeModal();
    showNotif();
    switchTab(currentTab); // Refresh current tab
}

// Edit functions
function editMateri(id) {
    editingId = id;
    openModal('materi');
    modalTitle.innerText = "Edit Materi Video";
}

function editSoal(type, subtes, pkg, idx) {
    editingId = idx;
    openModal('soal', { type, subtes, package: pkg });
    modalTitle.innerText = `Edit Soal #${idx + 1}`;
}

function editSubtest(id) {
    editingId = id;
    const s = appData.subtesData.find(x => x.id === id);
    openModal('subtes', s);
    modalTitle.innerText = `Edit Subtest: ${s.name}`;
}

function editPackage(type, subtes, packageName) {
    editingId = packageName;
    const detail = type === 'Arena TO' 
        ? (appData.latihanDetails[type]?.['all']?.find(d => d.name === packageName) || { name: packageName, durationText: '', status: 'Published', startDate: '', endDate: '', description: '', subtestDurations: {} })
        : (appData.latihanDetails[type]?.[subtes]?.find(d => d.name === packageName) || { name: packageName, duration: 0, status: 'Published' });
    
    if (type === 'Arena TO') {
        openModal('to-package', detail);
    } else {
        openModal('latihan-package', { type, subtes, pkgData: detail });
    }
    modalTitle.innerText = `Edit Paket: ${packageName}`;
}

// Delete functions
function deleteUser(email) {
    if (confirm("Hapus akun ini secara permanen?")) {
        appData.users = appData.users.filter(u => u.email !== email);
        saveData();
        renderUsers();
        showNotif("Akun berhasil dihapus");
    }
}

function deleteMateri(id) {
    if (confirm("Hapus video materi ini?")) {
        appData.videos = appData.videos.filter(v => v.id !== id);
        saveData();
        renderMateri();
        showNotif("Video berhasil dihapus");
    }
}

function deleteSubtest(id) {
    if (confirm(`Hapus subtes "${id}"? Hal ini tidak akan menghapus soal yang sudah ada, namun subtes ini tidak akan muncul lagi di pilihan.`)) {
        appData.subtesData = appData.subtesData.filter(s => s.id !== id);
        saveData();
        renderSubtes();
        showNotif("Subtes berhasil dihapus");
    }
}

function deleteSoal(type, subtes, pkg, idx) {
    if (!confirm('Hapus soal ini?')) return;
    
    if (type === 'Arena TO') {
        appData.questionsBank[type][pkg][subtes].splice(idx, 1);
    } else {
        appData.questionsBank[type][subtes][pkg].splice(idx, 1);
    }
    
    saveData();
    renderLatihanLevel4(type, subtes, pkg);
    showNotif("Soal telah dihapus.");
}

function deletePackage(type, subtes, packageName) {
    if (!confirm(`Hapus paket "${packageName}" beserta semua soal di dalamnya?`)) return;

    if (type === 'Arena TO') {
        delete appData.questionsBank[type][packageName];
        if (appData.latihanDetails[type]?.['all']) {
            appData.latihanDetails[type]['all'] = appData.latihanDetails[type]['all'].filter(d => d.name !== packageName);
        }
        saveData();
        renderLatihanLevel2(type);
    } else {
        delete appData.questionsBank[type][subtes][packageName];
        if (appData.latihanDetails[type]?.[subtes]) {
            appData.latihanDetails[type][subtes] = appData.latihanDetails[type][subtes].filter(d => d.name !== packageName);
        }
        saveData();
        renderLatihanLevel3(type, subtes, null);
    }
    showNotif("Paket berhasil dihapus.");
}

function togglePackageStatus(type, subtes, packageName) {
    const details = appData.latihanDetails[type]?.[subtes] || [];
    const idx = details.findIndex(d => d.name === packageName);
    
    if (idx !== -1) {
        details[idx].status = details[idx].status === 'Published' ? 'Draft' : 'Published';
        saveData();
        if (type === 'Arena TO') renderLatihanLevel2(type);
        else renderLatihanLevel3(type, subtes, null);
        showNotif(`Status paket berhasil diubah ke ${details[idx].status}`);
    }
}

function renderSoal() {
    const type = document.getElementById('filter-latihan-type').value;
    const subtes = document.getElementById('filter-subtes').value;
    const list = document.getElementById('soal-list');
    list.innerHTML = '';

    const questions = (appData.questionsBank[type] && appData.questionsBank[type][subtes]) || [];
    
    if (questions.length === 0) {
        list.innerHTML = `<div class="p-10 text-center text-gray-400 font-medium bg-gray-50 rounded-3xl border border-dashed border-gray-200">Belum ada soal untuk kategori ini.</div>`;
        return;
    }

    questions.forEach((q, idx) => {
        const div = document.createElement('div');
        div.className = "p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group";
        div.innerHTML = `
            <div class="flex items-center space-x-4 flex-1 min-w-0">
                <span class="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center font-bold text-emerald-600 text-xs flex-shrink-0">${idx + 1}</span>
                <p class="font-bold text-gray-700 truncate">${q.q}</p>
            </div>
            <div class="flex items-center space-x-2 ml-4">
                <button onclick="editSoal('${type}', '${subtes}', ${idx})" class="p-2 text-emerald-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button onclick="deleteSoal('${type}', '${subtes}', ${idx})" class="p-2 text-rose-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `;
        list.appendChild(div);
    });
}

// Utility
function showNotif(msg = "Perubahan berhasil disimpan!") {
    const n = document.getElementById('notif');
    document.getElementById('notif-msg').innerText = msg;
    n.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        n.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

async function saveData() {
    try {
        localStorage.setItem('edugrakAppData', JSON.stringify(appData));
        
        // Sync to server
        await fetch(`${API_URL}/appdata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData)
        });
        console.log('Admin: AppData synced to server');
    } catch (e) {
        console.error("Gagal menyimpan data:", e);
    }
}

// Start
init();
