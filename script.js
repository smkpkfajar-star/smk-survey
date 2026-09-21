const SHEET_DB_URL = 'https://sheetdb.io/api/v1/33lpt3jvnnudt';
let currentStudent = null;

// Trigger Keyboard Enter untuk Pencarian NIS
document.getElementById('nisInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchStudent();
    }
});

// Fungsi untuk Menampilkan/Menyembunyikan Textfield 'Lainnya'
function toggleLainnyaInput() {
    const selectElem = document.getElementById('dapatInfoSelect');
    const lainnyaContainer = document.getElementById('dapatInfoLainnyaContainer');
    const lainnyaInput = document.getElementById('dapatInfoLainnya');

    if (selectElem.value === 'Lainnya') {
        lainnyaContainer.classList.remove('hidden');
        lainnyaInput.setAttribute('required', 'required');
        lainnyaInput.focus();
    } else {
        lainnyaContainer.classList.add('hidden');
        lainnyaInput.removeAttribute('required');
        lainnyaInput.value = '';
    }
}

async function searchStudent() {
    const nis = document.getElementById('nisInput').value.trim();

    if (!nis) {
        showMessage('Silakan masukkan NIS terlebih dahulu.', 'warning');
        return;
    }

    const searchBtn = document.getElementById('searchBtn');
    searchBtn.disabled = true;
    searchBtn.innerHTML = `
        <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    `;

    try {
        const response = await fetch(`${SHEET_DB_URL}/search?NIS=${encodeURIComponent(nis)}`);
        const data = await response.json();

        if (data && data.length > 0) {
            currentStudent = data[0];
            showMessage('Data NIS ditemukan!', 'success');
            setTimeout(() => showStep2(), 300);
        } else {
            showMessage('NIS tidak ditemukan. Periksa kembali nomor Anda.', 'error');
        }
    } catch (error) {
        showMessage('Gagal terhubung ke server. Cek koneksi Anda.', 'error');
    } finally {
        searchBtn.disabled = false;
        searchBtn.innerHTML = 'Cek NIS';
    }
}

function showStep2() {
    document.getElementById('step1Content').classList.add('hidden');
    document.getElementById('step2Content').classList.remove('hidden');

    document.getElementById('studentName').textContent = currentStudent.NAMA || 'Siswa';
    document.getElementById('studentNis').textContent = currentStudent.NIS || '-';

    if (currentStudent.ASAL_SMP) {
        document.getElementById('asalSekolah').value = currentStudent.ASAL_SMP;
    }

    if (currentStudent.DAPAT_INFO) {
        const selectElem = document.getElementById('dapatInfoSelect');
        const options = Array.from(selectElem.options).map(opt => opt.value);

        if (options.includes(currentStudent.DAPAT_INFO)) {
            selectElem.value = currentStudent.DAPAT_INFO;
        } else {
            selectElem.value = 'Lainnya';
            document.getElementById('dapatInfoLainnya').value = currentStudent.DAPAT_INFO;
        }
        toggleLainnyaInput();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('dataForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const asalSekolah = document.getElementById('asalSekolah').value.trim();
    const selectValue = document.getElementById('dapatInfoSelect').value;
    const lainnyaValue = document.getElementById('dapatInfoLainnya').value.trim();

    if (!asalSekolah) {
        showMessage('Asal sekolah tidak boleh kosong.', 'warning');
        return;
    }

    if (!selectValue) {
        showMessage('Pilih salah satu sumber informasi.', 'warning');
        return;
    }

    if (selectValue === 'Lainnya' && !lainnyaValue) {
        showMessage('Sebutkan sumber informasi lainnya.', 'warning');
        return;
    }

    // Tentukan nilai final yang akan dikirim ke SheetDB
    const dapatInfoFinal = (selectValue === 'Lainnya') ? lainnyaValue : selectValue;

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Menyimpan...';

    try {
        const response = await fetch(`${SHEET_DB_URL}/NIS/${encodeURIComponent(currentStudent.NIS)}`, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    ASAL_SMP: asalSekolah,
                    DAPAT_INFO: dapatInfoFinal
                }
            })
        });

        const result = await response.json();

        if (response.ok && (result.updated > 0 || result.updated === undefined)) {
            showStep3();
        } else {
            showMessage('Gagal memperbarui data. Coba beberapa saat lagi.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Simpan Data';
        }
    } catch (error) {
        showMessage('Terjadi kesalahan: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Simpan Data';
    }
});

function showStep3() {
    document.getElementById('step2Content').classList.add('hidden');
    document.getElementById('step3Content').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showMessage(message, type) {
    const messageBox = document.getElementById('messageBox');
    let themeClass = 'bg-gray-900 text-white';

    if (type === 'success') themeClass = 'bg-purple-600 text-white';
    if (type === 'warning') themeClass = 'bg-amber-500 text-white';
    if (type === 'error') themeClass = 'bg-red-600 text-white';

    messageBox.innerHTML = `
        <div class="px-4 py-3 rounded-xl ${themeClass} text-xs sm:text-sm font-medium shadow-sm fade-in flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-2 font-bold text-white/70 hover:text-white">&times;</button>
        </div>
    `;
}

function resetAll() {
    currentStudent = null;
    document.getElementById('nisInput').value = '';
    document.getElementById('asalSekolah').value = '';
    document.getElementById('dapatInfoSelect').value = '';
    document.getElementById('dapatInfoLainnya').value = '';
    
    toggleLainnyaInput();

    document.getElementById('messageBox').innerHTML = '';
    document.getElementById('step1Content').classList.remove('hidden');
    document.getElementById('step2Content').classList.add('hidden');
    document.getElementById('step3Content').classList.add('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}