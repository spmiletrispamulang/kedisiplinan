// ====== GANTI URL DI BAWAH INI DENGAN URL WEB APP MILIK ANDA ======
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwChMdirBH9PsQjENa_cQzUmB_Hk3kz_l3S7dFRJaSlE_NNELO-ll_FzqB-78mxaqy3OQ/exec";

// Variabel global untuk menyimpan data riwayat sementara agar bisa dicetak ke PDF
let currentHistoryData = [];

// Sistem Navigasi Antar Menu
function navigate(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(pageId).classList.remove('hidden');
    document.getElementById(pageId).classList.add('active');
    event.target.classList.add('active');

    if (pageId === 'dashboard') loadDashboard();
}

// 1. Load Data Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getDashboard`);
        const result = await response.json();
        if (result.status === 'success') {
            document.getElementById('dash-total').innerText = result.total;
            document.getElementById('dash-l').innerText = result.male;
            document.getElementById('dash-p').innerText = result.female;
        }
    } catch (error) {
        console.error("Gagal memuat dashboard:", error);
    }
}

// 2. Pencarian Siswa (Diperbarui)
async function searchStudent() {
    const query = document.getElementById('searchInput').value;
    const resultBox = document.getElementById('searchResults');
    
    if (query.length < 2) {
        alert("Ketik setidaknya 2 huruf nama, kelas, atau wali kelas.");
        return;
    }

    resultBox.innerHTML = "<div class='result-item'>Mencari data...</div>";
    resultBox.classList.remove('hidden');

    try {
        const response = await fetch(`${SCRIPT_URL}?action=searchStudent&query=${query}`);
        const result = await response.json();

        resultBox.innerHTML = "";
        if (result.data.length === 0) {
            resultBox.innerHTML = "<div class='result-item'>Data tidak ditemukan.</div>";
            return;
        }

        result.data.forEach(siswa => {
            let div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `<strong>${siswa.nama}</strong> <br><small>${siswa.kelas} - Wali: ${siswa.wali_kelas}</small>`;
            div.onclick = () => selectStudent(siswa);
            resultBox.appendChild(div);
        });
    } catch (error) {
        resultBox.innerHTML = "<div class='result-item'>Terjadi kesalahan jaringan.</div>";
    }
}

// 3. Menampilkan Formulir Saat Siswa Diklik (Diperbarui)
function selectStudent(siswa) {
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('selectedStudentForm').classList.remove('hidden');
    
    document.getElementById('form-nis').value = siswa.nis;
    document.getElementById('form-walikelas').value = siswa.wali_kelas; // Simpan di form tersembunyi
    
    document.getElementById('form-nama').innerText = siswa.nama;
    document.getElementById('form-kelas').innerText = siswa.kelas;
    document.getElementById('form-wali-tampil').innerText = siswa.wali_kelas; // Tampilkan teksnya
}

// 4. Proses Submit (Diperbarui)
async function submitLateData(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    btn.innerText = "Menyimpan data...";
    btn.disabled = true;

    const fileInput = document.getElementById('form-foto').files[0];
    
    let payload = {
        action: 'addLateRecord',
        nis: document.getElementById('form-nis').value,
        nama: document.getElementById('form-nama').innerText,
        kelas: document.getElementById('form-kelas').innerText,
        wali_kelas: document.getElementById('form-walikelas').value, // Kirim ke Backend
        catatan: document.getElementById('form-catatan').value,
        foto_base64: null,
        foto_name: null
    };

    if (fileInput) {
        const reader = new FileReader();
        reader.onload = async function() {
            payload.foto_base64 = reader.result;
            payload.foto_name = fileInput.name;
            await sendData(payload, btn);
        };
        reader.readAsDataURL(fileInput);
    } else {
        await sendData(payload, btn);
    }
}

// 5. Load Riwayat Keterlambatan (Diperbarui)
async function loadHistory() {
    let dateVal = document.getElementById('filterDate').value;
    if (!dateVal) {
        dateVal = new Date().toISOString().split('T')[0];
        document.getElementById('filterDate').value = dateVal; 
    }

    const tbody = document.getElementById('historyBody');
    tbody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Sedang memuat data...</td></tr>";

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getLateRecords&date=${dateVal}`);
        const result = await response.json();

        tbody.innerHTML = "";
        if (result.data.length === 0) {
            currentHistoryData = []; 
            tbody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Tidak ada siswa terlambat pada tanggal ini.</td></tr>";
            return;
        }

        currentHistoryData = result.data; 

        result.data.forEach(row => {
            let tr = document.createElement('tr');
            let fotoHtml = row.url && row.url.includes("http") ? `<a href="${row.url}" target="_blank" class="img-link">Lihat Foto</a>` : "-";
            
            tr.innerHTML = `
                <td>${row.waktu}</td>
                <td>${row.nis}</td>
                <td><strong>${row.nama}</strong></td>
                <td>${row.kelas}</td>
                <td>${row.wali_kelas}</td> <!-- Tampilkan Wali Kelas -->
                <td>${row.catatan}</td>
                <td>${fotoHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Gagal memuat data.</td></tr>";
    }
}

// 6. Fungsi Generate File PDF (Diperbarui)
function downloadPDF() {
    if (currentHistoryData.length === 0) {
        alert("Tidak ada data terlambat untuk didownload pada tanggal tersebut.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dateVal = document.getElementById('filterDate').value;

    doc.setFontSize(16);
    doc.text("Laporan Data Siswa Terlambat", 14, 15);
    doc.setFontSize(11);
    doc.text(`Instansi: SMK Letris Pamulang | Tanggal Laporan: ${dateVal}`, 14, 22);

    // Tambah Header Wali Kelas
    const tableColumn = ["Waktu", "NIS", "Nama Siswa", "Kelas", "Wali Kelas", "Catatan"];
    const tableRows = [];

    currentHistoryData.forEach(row => {
        const rowData = [
            row.waktu,
            row.nis,
            row.nama,
            row.kelas,
            row.wali_kelas, // Data Wali Kelas
            row.catatan || "-"
        ];
        tableRows.push(rowData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 28,
        theme: 'grid',
        headStyles: { fillColor: [0, 86, 179] }, 
        styles: { fontSize: 9 }
    });

    doc.save(`Laporan_Terlambat_${dateVal}.pdf`);
}

// Otomatis load dashboard saat web dibuka
window.onload = loadDashboard;
