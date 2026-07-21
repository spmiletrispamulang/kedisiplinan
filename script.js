// ====== GANTI URL DI BAWAH INI DENGAN URL WEB APP MILIK ANDA ======
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwChMdirBH9PsQjENa_cQzUmB_Hk3kz_l3S7dFRJaSlE_NNELO-ll_FzqB-78mxaqy3OQ/exec";

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

// 2. Pencarian Siswa
async function searchStudent() {
    const query = document.getElementById('searchInput').value;
    const resultBox = document.getElementById('searchResults');
    
    if (query.length < 2) {
        alert("Ketik setidaknya 2 huruf nama atau kelas.");
        return;
    }

    resultBox.innerHTML = "<div class='result-item'>Mencari data...</div>";
    resultBox.classList.remove('hidden');

    try {
        const response = await fetch(`${SCRIPT_URL}?action=searchStudent&query=${query}`);
        const result = await response.json();

        resultBox.innerHTML = "";
        if (result.data.length === 0) {
            resultBox.innerHTML = "<div class='result-item'>Siswa tidak ditemukan.</div>";
            return;
        }

        result.data.forEach(siswa => {
            let div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `<strong>${siswa.nama}</strong> - ${siswa.kelas}`;
            div.onclick = () => selectStudent(siswa);
            resultBox.appendChild(div);
        });
    } catch (error) {
        resultBox.innerHTML = "<div class='result-item'>Terjadi kesalahan jaringan.</div>";
    }
}

// 3. Menampilkan Formulir Saat Siswa Diklik
function selectStudent(siswa) {
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('selectedStudentForm').classList.remove('hidden');
    
    document.getElementById('form-nis').value = siswa.nis;
    document.getElementById('form-nama').innerText = siswa.nama;
    document.getElementById('form-kelas').innerText = siswa.kelas;
}

// 4. Proses Submit (Termasuk Convert Foto ke Base64)
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
        catatan: document.getElementById('form-catatan').value,
        foto_base64: null,
        foto_name: null
    };

    // Fungsi membaca foto jika diupload
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

async function sendData(payload, btn) {
    try {
        // Menggunakan text/plain untuk melewati batasan CORS preflight
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' }, 
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            alert("Berhasil! Data siswa terlambat sudah dicatat.");
            document.getElementById('lateForm').reset();
            document.getElementById('selectedStudentForm').classList.add('hidden');
            document.getElementById('searchInput').value = "";
        }
    } catch (error) {
        alert("Gagal menyimpan data. Pastikan koneksi internet stabil.");
    }
    btn.innerText = "Simpan Pendataan";
    btn.disabled = false;
}

// 5. Load Riwayat Keterlambatan
async function loadHistory() {
    let dateVal = document.getElementById('filterDate').value;
    if (!dateVal) {
        // Default hari ini jika belum milih
        dateVal = new Date().toISOString().split('T')[0];
        document.getElementById('filterDate').value = dateVal; 
    }

    const tbody = document.getElementById('historyBody');
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Sedang memuat data...</td></tr>";

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getLateRecords&date=${dateVal}`);
        const result = await response.json();

        tbody.innerHTML = "";
        if (result.data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Tidak ada siswa terlambat pada tanggal ini.</td></tr>";
            return;
        }

        result.data.forEach(row => {
            let tr = document.createElement('tr');
            let fotoHtml = row.url.includes("http") ? `<a href="${row.url}" target="_blank" class="img-link">Lihat Foto</a>` : "-";
            
            tr.innerHTML = `
                <td>${row.waktu}</td>
                <td><strong>${row.nama}</strong></td>
                <td>${row.kelas}</td>
                <td>${row.catatan}</td>
                <td>${fotoHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Gagal memuat data.</td></tr>";
    }
}

// Otomatis load dashboard saat web dibuka
window.onload = loadDashboard;
