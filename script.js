const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxIgXsknXwYtl8pC1AWxI9W7C-Dfd0SHWl9uXrNWPEl67NRrZqYzE2aeJOgT4EYM_PmKw/exec";
let currentHistoryData = [];
let chartSiswaInst = null;
let chartKelasInst = null;

function navigate(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.remove('hidden');
    document.getElementById(pageId).classList.add('active');
    event.target.classList.add('active');

    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'rekap') loadRekap();
}

async function loadDashboard() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getDashboard`);
        const result = await response.json();
        
        if (result.status === 'success') {
            // Tulis Teks Dinamis
            if(result.pengaturan) {
                if(document.getElementById('desc_dashboard')) document.getElementById('desc_dashboard').innerHTML = result.pengaturan.desc_dashboard || '';
                if(document.getElementById('desc_input')) document.getElementById('desc_input').innerHTML = result.pengaturan.desc_input || '';
                if(document.getElementById('desc_riwayat')) document.getElementById('desc_riwayat').innerHTML = result.pengaturan.desc_riwayat || '';
                if(document.getElementById('desc_rekap')) document.getElementById('desc_rekap').innerHTML = result.pengaturan.desc_rekap || '';
            }

            // Tulis Angka
            document.getElementById('dash-total').innerText = result.total;
            document.getElementById('dash-l').innerText = result.male;
            document.getElementById('dash-p').innerText = result.female;
            document.getElementById('dash-terlambat').innerText = result.totalTerlambat;

            // Render Grafik
            renderCharts(result.topSiswa, result.topKelas);
        }
    } catch (error) { console.error("Error Dashboard:", error); }
}

function renderCharts(topSiswa, topKelas) {
    // Grafik Siswa
    if (chartSiswaInst) chartSiswaInst.destroy();
    const ctxSiswa = document.getElementById('chartSiswa').getContext('2d');
    chartSiswaInst = new Chart(ctxSiswa, {
        type: 'bar',
        data: {
            labels: topSiswa.map(s => s.nama.split(" ")[0]), // Ambil kata pertama nama agar rapi
            datasets: [{ label: 'Jml Terlambat', data: topSiswa.map(s => s.count), backgroundColor: '#ffc107' }]
        },
        options: { indexAxis: 'y', scales: { x: { beginAtZero: true, ticks:{stepSize:1} } } }
    });

    // Grafik Kelas
    if (chartKelasInst) chartKelasInst.destroy();
    const ctxKelas = document.getElementById('chartKelas').getContext('2d');
    chartKelasInst = new Chart(ctxKelas, {
        type: 'bar',
        data: {
            labels: topKelas.map(k => k.kelas),
            datasets: [{ label: 'Jml Terlambat', data: topKelas.map(k => k.count), backgroundColor: '#0056b3' }]
        },
        options: { scales: { y: { beginAtZero: true, ticks:{stepSize:1} } } }
    });

    // Info Wali Kelas Tertinggi
    if (topKelas.length > 0) {
        document.getElementById('infoKelasTop').innerHTML = `💡 Kelas pelanggar tertinggi: ${topKelas[0].kelas} <br>(Wali Kelas: ${topKelas[0].wali})`;
    } else {
        document.getElementById('infoKelasTop').innerHTML = "Belum ada data";
    }
}

async function loadRekap() {
    const tbody = document.getElementById('rekapBody');
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Mengambil rekap data...</td></tr>";
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getRekap`);
        const result = await response.json();
        tbody.innerHTML = "";
        if (result.data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Bagus! Belum ada siswa yang terlambat lebih dari 1 kali.</td></tr>";
            return;
        }
        result.data.forEach((row, i) => {
            let tr = document.createElement('tr');
            tr.innerHTML = `<td>${i+1}</td><td>${row.nis}</td><td><strong>${row.nama}</strong></td><td>${row.kelas}</td><td>${row.wali_kelas}</td>
                            <td style="color:red; font-weight:bold; text-align:center;">${row.count}x</td>`;
            tbody.appendChild(tr);
        });
    } catch (e) { tbody.innerHTML = "<tr><td colspan='6'>Error load data.</td></tr>"; }
}

// [Fungsi searchStudent, selectStudent, submitLateData, sendData, loadHistory, downloadPDF tetap sama seperti versi Anda yang sebelumnya agar tidak menimpa perbaikan yg sudah berhasil]

// SISA FUNGSI BAWAAN (Jangan Ubah)
async function searchStudent() {
    const query = document.getElementById('searchInput').value;
    const resultBox = document.getElementById('searchResults');
    if (query.length < 2) { alert("Ketik setidaknya 2 huruf"); return; }
    resultBox.innerHTML = "<div class='result-item'>Mencari data...</div>";
    resultBox.classList.remove('hidden');
    try {
        const response = await fetch(`${SCRIPT_URL}?action=searchStudent&query=${query}`);
        const result = await response.json();
        resultBox.innerHTML = "";
        if (result.data.length === 0) { resultBox.innerHTML = "<div class='result-item'>Data tidak ditemukan.</div>"; return; }
        result.data.forEach(siswa => {
            let div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `<strong>${siswa.nama}</strong> <br><small>${siswa.kelas} - Wali: ${siswa.wali_kelas}</small>`;
            div.onclick = () => selectStudent(siswa);
            resultBox.appendChild(div);
        });
    } catch (error) { resultBox.innerHTML = "<div class='result-item'>Error jaringan.</div>"; }
}

function selectStudent(siswa) {
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('selectedStudentForm').classList.remove('hidden');
    document.getElementById('form-nis').value = siswa.nis;
    document.getElementById('form-walikelas').value = siswa.wali_kelas;
    document.getElementById('form-nama').innerText = siswa.nama;
    document.getElementById('form-kelas').innerText = siswa.kelas;
    document.getElementById('form-wali-tampil').innerText = siswa.wali_kelas;
}

async function submitLateData(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    btn.innerText = "Menyimpan..."; btn.disabled = true;
    const fileInput = document.getElementById('form-foto').files[0];
    let payload = {
        action: 'addLateRecord', nis: document.getElementById('form-nis').value,
        nama: document.getElementById('form-nama').innerText, kelas: document.getElementById('form-kelas').innerText,
        wali_kelas: document.getElementById('form-walikelas').value, catatan: document.getElementById('form-catatan').value,
        foto_base64: null, foto_name: null
    };
    if (fileInput) {
        const reader = new FileReader();
        reader.onload = async function() { payload.foto_base64 = reader.result; payload.foto_name = fileInput.name; await sendData(payload, btn); };
        reader.readAsDataURL(fileInput);
    } else { await sendData(payload, btn); }
}

async function sendData(payload, btn) {
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (result.status === 'success') {
            alert("Berhasil!"); document.getElementById('lateForm').reset();
            document.getElementById('selectedStudentForm').classList.add('hidden'); document.getElementById('searchInput').value = "";
        } else { alert("Gagal: " + result.message); }
    } catch (error) { alert("Error sistem."); } finally { btn.innerText = "Simpan Pendataan"; btn.disabled = false; }
}

async function loadHistory() {
    let dateVal = document.getElementById('filterDate').value;
    if (!dateVal) { dateVal = new Date().toISOString().split('T')[0]; document.getElementById('filterDate').value = dateVal; }
    const tbody = document.getElementById('historyBody');
    tbody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Sedang memuat...</td></tr>";
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getLateRecords&date=${dateVal}`);
        const result = await response.json();
        tbody.innerHTML = "";
        if (result.data.length === 0) { currentHistoryData = []; tbody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Tidak ada data.</td></tr>"; return; }
        currentHistoryData = result.data;
        result.data.forEach(row => {
            let tr = document.createElement('tr');
            let fotoHtml = row.url && row.url.includes("http") ? `<a href="${row.url}" target="_blank" class="img-link">Foto</a>` : "-";
            tr.innerHTML = `<td>${row.waktu}</td><td>${row.nis}</td><td><strong>${row.nama}</strong></td><td>${row.kelas}</td><td>${row.wali_kelas}</td><td>${row.catatan}</td><td>${fotoHtml}</td>`;
            tbody.appendChild(tr);
        });
    } catch (error) { tbody.innerHTML = "<tr><td colspan='7'>Error.</td></tr>"; }
}

function downloadPDF() {
    if (currentHistoryData.length === 0) return alert("Tidak ada data.");
    const { jsPDF } = window.jspdf; const doc = new jsPDF();
    const dateVal = document.getElementById('filterDate').value;
    doc.setFontSize(16); doc.text("Laporan Data Siswa Terlambat", 14, 15); doc.setFontSize(11); doc.text(`Tanggal: ${dateVal}`, 14, 22);
    const tableColumn = ["Waktu", "NIS", "Nama Siswa", "Kelas", "Wali Kelas", "Catatan"];
    const tableRows = [];
    currentHistoryData.forEach(row => { tableRows.push([row.waktu, row.nis, row.nama, row.kelas, row.wali_kelas, row.catatan || "-"]); });
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 28, headStyles: { fillColor: [0, 86, 179] }, styles: { fontSize: 9 } });
    doc.save(`Laporan_Terlambat_${dateVal}.pdf`);
}
window.onload = loadDashboard;
