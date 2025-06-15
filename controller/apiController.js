const dbModel = require('../model/apiModel');
const timeMoment = require('moment-timezone');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const moment = require('moment'); 
require('moment/locale/id'); 

// Fungsi untuk menghasilkan token JWT
const generateToken = (pengguna) => {
    console.log("ID:", pengguna.id);
    console.log("Username:", pengguna.username);
    console.log("Role:", pengguna.role);
    return jwt.sign(
        { id: pengguna.id, username: pengguna.username, nama: pengguna.nama, role: pengguna.role }
        , process.env.JWT_SECRET, { expiresIn: '5h' });
}

//fungsi authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            status: false,
            pesan: "Token tidak ditemukan",
            kode: 401
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                status: false,
                pesan: "Token tidak valid",
                kode: 403
            });
        }    
        req.user = user;
        next();
    });
}

// Fungsi untuk menangani login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ pesan: 'Username dan Password tidak ditemukan' });
        }

        const [data] = await dbModel.getUsernameLogin(username);
        if (data.length === 0) {
            return res.status(401).json({ pesan: 'Username tidak ditemukan' });
        }

        const user = data[0];
        if (user.password !== password) {
            return res.status(401).json({ pesan: 'Password salah' });
        }

        // Cek status akun
        if (user.status === 'pending') {
            return res.status(403).json({ 
                pesan: 'Akun Anda masih menunggu persetujuan admin' 
            });
        }

        if (user.status === 'ditolak') {
            return res.status(403).json({ 
                pesan: 'Akun Anda telah ditolak oleh admin' 
            });
        }

        // Hanya user dengan status 'approved' yang bisa login
        if (user.status !== 'diterima') {
            return res.status(403).json({ 
                pesan: 'Akun Anda tidak dapat digunakan' 
            });
        }

        const token = generateToken(user);

        return res.status(200).json({ 
            pesan: 'Login berhasil',
            data: {
                id: user.id,
                username: user.username,
                nama: user.nama,
                email: user.email,
                no_telp: user.no_telp,
                role: user.role,
                token: token
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

const daftar = async (req, res) => {
    try {
        const { username, password, nama, email, confirmPassword, no_telp } = req.body;

        // Validasi input
        if (!username || !password || !nama || !email || !confirmPassword || !no_telp) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Validasi password match
        if (password !== confirmPassword) {
            return res.status(400).json({ pesan: 'Password dan Konfirmasi Password tidak cocok' });
        }

        // Periksa apakah username atau email sudah terdaftar
        const [data] = await dbModel.validasiDaftar(username, email);
        if (data.length > 0) {
            return res.status(400).json({ pesan: 'Username atau Email sudah terdaftar' });
        }

        // Simpan dengan status pending
        await dbModel.postDaftar(username, password, nama, email, no_telp);
        
        res.status(201).json({ 
            pesan: 'Pendaftaran berhasil! Akun Anda menunggu persetujuan admin.' 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};

// Fungsi untuk menambahkan produk ke keranjang
const pembeliTambahKeranjang = async (req, res) => {
    try {
        const id_pengguna  = req.user.id; // Mengambil id_pengguna dari token JWT
        const { id_varian_produk, jumlah_order } = req.body;

        console.log("ID Pengguna:", id_pengguna);
        console.log("ID Varian Produk:", id_varian_produk); 
        console.log("Jumlah Order:", jumlah_order);

        if (!id_pengguna || !id_varian_produk || !jumlah_order) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Ambil stok saat ini dari database
        const [stokRows] = await dbModel.getStokVarianProduk(id_varian_produk);

        console.log("Stok Rows:", stokRows);

        if (stokRows.length === 0) {
            return res.status(404).json({ pesan: 'Varian produk tidak ditemukan' });
        }

        

        const stokSaatIni = stokRows[0].stok;

        // Cek apakah stok cukup
        if (stokSaatIni < jumlah_order) {
            return res.status(400).json({ pesan: `Stok tidak mencukupi. Stok saat ini: ${stokSaatIni}` });
        }

        // Simpan ke keranjang dan kurangi stok
        await dbModel.postPembeliTambahKeranjang(id_pengguna, id_varian_produk, jumlah_order);
        await dbModel.updateStokVarianProduk(id_varian_produk, jumlah_order);

        return res.status(201).json({ pesan: 'Produk berhasil ditambahkan ke keranjang' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};


// Fungsi untuk menghasilkan nomor faktur
// Format: FAK-YYYYMMDDHHmmss-RANDOM_NUMBER
const generateNomorFaktur = () => {
    const tanggal = timeMoment().format('YYYYMMDDHHmmss');
    const randomAngka = Math.floor(1000 + Math.random() * 9000); // 4 digit acak
    return `FAK-${tanggal}-${randomAngka}`;
};

// Fungsi untuk menangani proses pemesanan produk oleh pembeli
const pembeliOrderProduk = async (req, res) => {
    try {
        const id_pengguna = req.user.id;
        const {
            id_metode_pembayaran,
            total_harga,
            nama_pengirim,
            bank_pengirim,
            alamat_pengiriman
        } = req.body;

        const bukti_transfer_files = req.files || [];
        const bukti_transfer_filenames = bukti_transfer_files.map(file => file.filename);

        const [data] = await dbModel.cekIdOrderKosong(id_pengguna);
        if (data.length === 0) {
            return res.status(401).json({ pesan: 'Tidak ada item order yang belum dibayar' });
        }

        const [resultOrder] = await dbModel.postPembeliOrderProduk(id_metode_pembayaran, total_harga);
        const id_order = resultOrder.insertId;

        await dbModel.updateItemOrder(id_order, id_pengguna);
        await dbModel.postPengiriman(id_order, alamat_pengiriman);
        const nomor_faktur = generateNomorFaktur();
        await dbModel.postFakturPembeli(id_order, nomor_faktur);

        // 🔁 Buat id_pembayaran satu kali saja
        const [resultPembayaran] = await dbModel.postDataPembayaranPembeli(id_order, nama_pengirim, bank_pengirim);
        const id_pembayaran = resultPembayaran.insertId;

        // 🔁 Simpan semua bukti_transfer dengan id_pembayaran yang sama
        for (const filename of bukti_transfer_filenames) {
            await dbModel.postDataBuktiTransferPembeli(id_pembayaran, filename);
        }

        res.status(201).json({ pesan: 'Produk berhasil dipesan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};


// Fungsi untuk mengambil riwayat transaksi pembeli berdasarkan ID pengguna
const pembeliRiwayatTransaksi = async (req, res) => {
    try {
        const id  = req.user.id;

        // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getPembeliRiwayatTransaksi(id);

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Riwayat transaksi tidak ditemukan' });
        }

        // Mengembalikan data riwayat transaksi
        return res.status(200).json({ pesan: 'Riwayat transaksi berhasil diambil', data: data.map(item => ({
            ...item,
            tanggal_transfer: timeMoment(item.tanggal_transfer).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
        }))
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// Fungsi untuk mengambil detail riwayat transaksi pembeli berdasarkan ID Orderan
const pembeliRiwayatTransaksiDetail = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        const [data] = await dbModel.getPembeliRiwayatTransaksiDetail(id);

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Riwayat transaksi tidak ditemukan' });
        }

        // Mengembalikan data riwayat transaksi
        return res.status(200).json({ pesan: 'Riwayat transaksi berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

const pembeliUlasanProduk = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getPembeliUlasanProduk(id);

        console.log("Data:", data);

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Transaksi tidak ditemukan' });
        }

        // Mengembalikan data riwayat transaksi
        return res.status(200).json({ pesan: 'Transaksi ditemukan', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// Fungsi untuk menambahkan komentar oleh pembeli
const pembeliTambahKomentar = async (req, res) => {
    try {
        const id_pengguna = req.user.id;
        const { id_produk, id_varian_produk, rating, komentar } = req.body; 

        // Validasi Pastikan semua field diisi
        if (!id_produk || !id_pengguna || !id_varian_produk || !rating || !komentar) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data komentar ke database
        await dbModel.postPembeliTambahKomentar(id_produk, id_pengguna, id_varian_produk, rating, komentar);
        res.status(201).json({ pesan: 'Ulasan berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

const pembeliFaktur = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await dbModel.getFakturPembeli(id);
        console.log("Data Faktur:", rows);

        if (rows.length === 0) {
            return res.status(404).json({ pesan: 'Faktur tidak ditemukan' });
        }

        // Ambil informasi utama dari baris pertama
        const fakturInfo = {
            nomor_faktur: rows[0].nomor_faktur,
            tanggal_faktur: moment(rows[0].tanggal_faktur).locale('id').format('DD MMMM YYYY, HH:mm'),
            id: rows[0].id,
            nama_pengguna: rows[0].nama_pengguna,
            items: rows.map(item => ({
                nama_barang: item.nama_barang,
                warna: item.warna,
                ukuran: item.ukuran,
                jumlah_order: item.jumlah_order,
                harga: item.harga
            }))
        };

        return res.status(200).json({
            pesan: 'Faktur berhasil diambil',
            data: fakturInfo
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};
const getPengirimanData = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL


    console.log("ID Pengiriman:", id);  
        // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getPengiriman(id);

        console.log("Data Pengiriman:", data);

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Riwayat transaksi tidak ditemukan' });
        }

        // Mengembalikan data riwayat transaksi
        return res.status(200).json({ pesan: 'Riwayat transaksi berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// Fungsi untuk menangani pembeli yang ingin mengupdate profile password
const pembeliProfilePassword = async (req, res) => {
    try {
        const id = req.user.id; // Mengambil id dari token JWT
        const { password } = req.body; // Mengambil password dari body request

        // Validasi Pastikan semua field diisi
        if (!password) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAkunPembeliPassword(id, password);
        res.status(200).json({ pesan: 'Password berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// Fungsi untuk menangani pembeli yang ingin mengupdate profile nama
const pembeliProfileNama = async (req, res) => {
    try {
        const id = req.user.id; // Mengambil id dari token JWT
        const { nama } = req.body; // Mengambil nama dari body request

        // Validasi Pastikan semua field diisi
        if (!nama) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAkunPembeliNama(id, nama);
        res.status(200).json({ pesan: 'Nama berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// Fungsi untuk menangani pembeli yang ingin mengupdate profile nomor telepon
const pembeliProfileNomorTelepon = async (req, res) => {
    try {
        const id = req.user.id; // Mengambil id dari token JWT
        const { nomor_telp } = req.body; // Mengambil nomor telepon dari body request

        // Validasi Pastikan semua field diisi
        if (!nomor_telp) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAkunPembeliNomorTelepon(id, nomor_telp);
        res.status(200).json({ pesan: 'Nomor telepon berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// Fungsi untuk menangani pembeli yang ingin mengupdate profile email
const pembeliProfileEmail = async (req, res) => {
    try {
        const id = req.user.id; // Mengambil id dari token JWT
        const { email } = req.body; // Mengambil email dari body request

        // Validasi Pastikan semua field diisi
        if (!email) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAkunPembeliEmail(id, email);
        res.status(200).json({ pesan: 'Email berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//Fungsi untuk tampil produk
const tampilProduk = async (req, res) => {
    try {
        const [data] = await dbModel.getTampilProduk();
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Produk tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'Data produk berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//Fungsi untuk tampil produk detail
const tampilProdukDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await dbModel.getTampilProdukDetail(id);

        if (rows.length === 0) {
            return res.status(404).json({ pesan: 'Produk tidak ditemukan' });
        }

        // Ambil data produk dari baris pertama (karena semua baris punya info produk yg sama)
        const produk = {
            id: rows[0].id,
            nama: rows[0].nama_produk,
            harga_awal: rows[0].harga_awal,
            deskripsi: rows[0].deskripsi_produk,
            harga: rows[0].harga_produk,
            link_gambar: rows[0].link_gambar_produk,
            kategori: rows[0].kategori_produk,
            created_at: rows[0].created_at,
            varian: rows.map(row => ({
                id_varian: row.id_varian,
                warna: row.warna_produk,
                ukuran: row.ukuran_produk,
                stok: row.stok_produk,
                link_gambar_varian: row.link_gambar_varian
            }))
        };

        return res.status(200).json({
            pesan: 'Data produk berhasil diambil',
            data: produk
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};


// Fungsi untuk menampilkan ulasan produk
const tampilUlasanProduk = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const [data] = await dbModel.getTampilUlasanProduk(id);
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Ulasan produk tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'Data ulasan produk berhasil diambil', data: data.map(item => ({
            ...item,
            tanggal_komentar: timeMoment(item.tanggal_komentar).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss')
        })) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data karyawan pengajuan
const karyawanTampilPengajuanIzin = async (req, res) => {
    try {
        const id  = req.user.id; 
        const [data] = await dbModel.getPengajuanIzinKaryawan(id);
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Pengajuan izin tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'Data pengajuan izin berhasil diambil', data: data.map(item => ({
            ...item,
            tanggal_mulai: timeMoment(item.tanggal_mulai).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
            tanggal_akhir: timeMoment(item.tanggal_akhir).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
        })) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menghapus pengajuan izin karyawan
const karyawanDeletePengajuanIzin = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Validasi Pastikan id diisi
        if (!id) {
            return res.status(400).json({ pesan: 'Harap Mengisikan ID Pengajuan Izin' });
        }

        // Hapus data pengajuan izin dari database
        await dbModel.deleteKaryawanPengajuanIzin(id);
        res.status(200).json({ pesan: 'Pengajuan izin berhasil dihapus' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk karyawan tambah pengajuan izin
const karyawanTambahPengajuanIzin = async (req, res) => {
    try {
        const id_pengguna = req.user.id; 
        const {tipe_izin, deskripsi, tanggal_mulai, tanggal_akhir } = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!id_pengguna || !tipe_izin || !deskripsi || !tanggal_mulai || !tanggal_akhir) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.postKaryawanTambahPengajuanIzin(id_pengguna, tipe_izin, deskripsi, tanggal_mulai, tanggal_akhir);
        res.status(201).json({ pesan: 'Pengajuan izin berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk karyawan tambah absensi, jika hari ini sudah absen, maka tidak bisa absen lagi
const karyawanTambahAbsensi = async (req, res) => {
    try {
        const id_pengguna = req.user.id; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!id_pengguna) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Cek apakah karyawan sudah absen hari ini
        const [data] = await dbModel.cekAbensiKaryawan(id_pengguna);
        if (data.length > 0) {
            return res.status(400).json({ pesan: 'Anda sudah melakukan absen hari ini' });
        }
        console.log("ID Pengguna:", id_pengguna);
        console.log("Data:", data);

        // Simpan data ke database
        await dbModel.postKaryawanTambahAbsensi(id_pengguna);
        res.status(201).json({ pesan: 'Absensi berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk tampil data karyawan penjualan offline
const karyawanTampilTambahPenjualanOffline = async (req, res) => {
    try {
        const [data] = await dbModel.getKaryawanPenjualanOffline();
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data penjualan offline tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'Data penjualan offline berhasil diambil', data: data.map(item => ({
            ...item,
            tanggal: timeMoment(item.tanggal).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
        })) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk karyawan tambah penjualan offline
const karyawanTambahPenjualanOffline = async (req, res) => {
    try {
        const id_pengguna = req.user.id; // Mengambil id_pengguna dari token JWT
        const {id_varian_produk, jumlah} = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!id_varian_produk || !id_pengguna || !jumlah) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.postKaryawanTambahPenjualanOffline(id_varian_produk, id_pengguna, jumlah);
        await dbModel.updateStokVarianProduk(id_varian_produk, jumlah);
        res.status(201).json({ pesan: 'Penjualan offline berhasil ditambahkan dan stok berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk tampil data absensi karyawan pada admin
const adminTampilKaryawanAbsensi = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilAbsensiKaryawan();
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data absensi karyawan tidak ditemukan' });
        }

        // Perbaikan pada penggunaan map
        return res.status(200).json({
            pesan: 'Data absensi karyawan berhasil diambil',
            data: data.map((item) => ({
                ...item,
                tanggal: timeMoment(item.tanggal).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
            })),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// Fungsi untuk tampil data pengajuan izin karyawan pada admin
const adminTampilKaryawanIzin = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilPengajuanIzinKaryawan();
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data pengajuan izin karyawan tidak ditemukan' });
        }
        

        // Format tanggal pada setiap data pengajuan izin
        return res.status(200).json({
            pesan: 'Data pengajuan izin karyawan berhasil diambil',
            data: data.map((item) => ({
                ...item,
                tanggal_mulai: timeMoment(item.tanggal_mulai).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
                tanggal_akhir: timeMoment(item.tanggal_akhir).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
                
            })),
            
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data pengajuan izin karyawan detail pada admin
const adminTampilKaryawanIzinDetail = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const [data] = await dbModel.getAdminTampilPengajuanIzinKaryawanDetail(id);
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data pengajuan izin karyawan tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'Data pengajuan izin karyawan berhasil diambil',
            data: data.map((item) => ({
                ...item,
                tanggal_mulai: timeMoment(item.tanggal_mulai).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
                tanggal_akhir: timeMoment(item.tanggal_akhir).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
            })),
         });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk mengupdate pengajuan izin karyawan pada admin
const adminUpdateKaryawanIzin = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { status } = req.body; // Mengambil status dari body request

        // Validasi Pastikan semua field diisi
        if (!status) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAdminStatusPengajuanIzinKaryawan(id, status);
        res.status(200).json({ pesan: 'Status pengajuan izin berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menambahkan produk dan varian produk oleh admin
const adminTambahProduk = async (req, res) => {
    try {
        const { nama_produk, deskripsi, harga_produk, harga_awal, harga_modal, kategori } = req.body;
        const files = req.files || [];

        const link_gambar = files.map(file => ({
            filename: file.filename,
            originalname: file.originalname
        }));

        let parsedVarian = [];
        if (req.body.varian) {
            parsedVarian = typeof req.body.varian === 'string'
                ? JSON.parse(req.body.varian)
                : req.body.varian;
        }

        if (
            !nama_produk ||
            !deskripsi ||
            !harga_produk ||
            parsedVarian.length === 0 ||
            link_gambar.length === 0 ||
            !harga_awal ||
            !harga_modal ||
            !kategori
        ) {
            return res.status(400).json({ pesan: 'Data produk tidak lengkap atau format salah.' });
        }

        // Gambar utama adalah gambar pertama
        const gambarUtama = link_gambar[0].filename;

        const result = await dbModel.postAdminTambahProduk(
            nama_produk,
            deskripsi,
            harga_produk,
            gambarUtama,
            kategori
        );

        const id_produk = result[0].insertId;

        await dbModel.postHargaModal(id_produk, harga_modal);
        await dbModel.postHargaAsli(id_produk, harga_awal);

        // Gambar varian mulai dari index ke-1
        const gambarVarianList = link_gambar.slice(1);

        for (let i = 0; i < parsedVarian.length; i++) {
    const { warna, ukuran } = parsedVarian[i];
    const gambarVarian = gambarVarianList[i];

    if (!warna || !Array.isArray(ukuran) || ukuran.length === 0 || !gambarVarian) continue;

    for (let j = 0; j < ukuran.length; j++) {
        const { ukuran: nilaiUkuran, stok } = ukuran[j];

        if (
            (nilaiUkuran === undefined || nilaiUkuran === null || nilaiUkuran === '') ||
            (stok === undefined || stok === null)
        ) continue;

        await dbModel.postAdminTambahVarianProduk(
            id_produk,
            warna,
            nilaiUkuran,             // contoh: 36
            stok,                    // contoh: 10
            gambarVarian.filename    // gambar untuk varian ini
        );
    }
}


        res.status(201).json({ pesan: 'Produk dan semua varian berhasil ditambahkan.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ pesan: 'Terjadi kesalahan saat menyimpan data produk.' });
    }
};


//fungsi untuk mengubah produk dan varian produk oleh admin
const adminUpdateProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_produk, deskripsi, harga_produk, varian, harga_awal } = req.body;
    const files = req.files || [];

    // Logging isi request
    console.log("====== REQUEST MASUK ======");
    console.log("ID Produk:", id);
    console.log("Nama Produk:", nama_produk);
    console.log("Deskripsi:", deskripsi);
    console.log("Harga Produk:", harga_produk);
    console.log("Harga Awal:", harga_awal);
    console.log("Varian (raw):", varian);
    console.log("Files Diupload:", files.map(f => f.originalname));

    const link_gambar = files.map(file => ({
      filename: file.filename,
      originalname: file.originalname
    }));

    if (!id || !nama_produk || !deskripsi || !harga_produk) {
      return res.status(400).json({
        pesan: 'Data tidak lengkap atau format salah.'
      });
    }

    let parsedVarian = [];
    try {
      parsedVarian = typeof varian === 'string' ? JSON.parse(varian) : varian;
      console.log("Parsed Varian:", parsedVarian);
    } catch (err) {
      console.error("❌ Gagal parse varian:", err);
      return res.status(400).json({
        pesan: 'Format varian tidak valid.'
      });
    }

    // PERBAIKAN: Pisahkan logika gambar utama dan gambar varian dengan benar
    const varianYangPerluGambarBaru = parsedVarian.filter(v => v.has_new_image === true);
    const jumlahGambarVarian = varianYangPerluGambarBaru.length;
    
    // Tentukan apakah ada gambar utama baru
    const adaGambarUtamaBaru = link_gambar.length > jumlahGambarVarian;

    console.log("🔍 Analisis Gambar:");
    console.log("Total files:", link_gambar.length);
    console.log("Varian perlu gambar baru:", jumlahGambarVarian);
    console.log("Ada gambar utama baru:", adaGambarUtamaBaru);

    let gambarUtama = null;
    let varianImageStartIndex = 0;

    // Set gambar utama dan index start untuk varian
    if (adaGambarUtamaBaru) {
      gambarUtama = link_gambar[0].filename;
      varianImageStartIndex = 1; // Gambar varian mulai dari index 1
      console.log("✅ Gambar utama baru:", gambarUtama);
    } else {
      varianImageStartIndex = 0; // Semua gambar untuk varian
      console.log("ℹ️ Tidak ada gambar utama baru");
    }

    // Update produk - dengan atau tanpa gambar baru
    if (gambarUtama) {
      await dbModel.updateProduk(id, nama_produk, deskripsi, harga_produk, gambarUtama);
      console.log("✅ Update produk dengan gambar baru");
    } else {
      await dbModel.updateProdukTanpaGambar(id, nama_produk, deskripsi, harga_produk);
      console.log("✅ Update produk tanpa mengubah gambar");
    }

    // PERBAIKAN: Process varian dengan validasi ID yang lebih ketat
    let currentVarianImageIndex = varianImageStartIndex;

    for (const v of parsedVarian) {
      // PERBAIKAN: Gunakan id_varian secara konsisten
      const { id_varian, warna, ukuran, stok, is_new, has_new_image } = v;

      console.log(`\n🔄 Processing Varian: ${warna} (ID: ${id_varian})`);
      console.log(`   - is_new: ${is_new}`);
      console.log(`   - has_new_image: ${has_new_image}`);
      console.log(`   - stok: ${stok}`);
      console.log(`   - ukuran: ${ukuran}`);

      // PERBAIKAN: Validasi ID untuk varian existing
      if (!is_new && (!id_varian || id_varian === null || id_varian === undefined)) {
        console.error(`❌ ID varian tidak valid untuk varian existing: ${warna}`);
        continue; // Skip varian ini
      }

      let filename = null;
      
      // Tentukan filename hanya jika has_new_image = true
      if (has_new_image && currentVarianImageIndex < link_gambar.length) {
        filename = link_gambar[currentVarianImageIndex].filename;
        currentVarianImageIndex++;
        console.log(`📸 Menggunakan gambar: ${filename} untuk varian ${warna}`);
      }

      if (id_varian && !is_new) {
        // PERBAIKAN: Update varian existing dengan validasi ID yang ketat
        if (has_new_image && filename) {
          // Ada gambar baru untuk varian existing
          await dbModel.updateVarianProduk(id_varian, warna, ukuran, stok, filename);
          console.log(`🟡 Update Varian ID: ${id_varian} dengan gambar baru: ${filename}, stok: ${stok}, ukuran: ${ukuran}`);
        } else {
          // Tidak ada gambar baru, tapi tetap update stok dan data lainnya
          await dbModel.updateVarianProdukTanpaGambar(id_varian, warna, ukuran, stok);
          console.log(`🟡 Update Varian ID: ${id_varian} tanpa mengubah gambar, stok: ${stok}, ukuran: ${ukuran}`);
        }
      } else if (is_new) {
        // Tambah varian baru
        const finalFilename = filename || '';
        
        await dbModel.insertVarianBaru(id, warna, ukuran, stok, finalFilename);
        console.log(`🟢 Tambah Varian Baru | Warna: ${warna} | Ukuran: ${ukuran} | Stok: ${stok} | Gambar: ${finalFilename || 'TIDAK ADA'}`);
      }
    }

    // Update harga awal
    await dbModel.updateHargaAsli(id, harga_awal);
    console.log("✅ Update harga awal selesai");

    console.log("✅ Update produk dan varian selesai.");

    return res.status(200).json({
      pesan: 'Produk dan varian berhasil diperbarui.'
    });
  } catch (error) {
    console.error('❌ Error saat update produk:', error);
    return res.status(500).json({
      pesan: 'Terjadi kesalahan saat memperbarui produk.'
    });
  }
};

//fungsi untuk menampilkan di halaman update admin produk
const adminTampilUpdateProduk = async (req, res) => {
    const { id } = req.params;
    try {
        const [produkResult] = await dbModel.getAdminProduk(id);
        if (produkResult.length === 0) {
            return res.status(404).json({ pesan: 'Data produk tidak ditemukan' });
        }

        const [varianResult] = await dbModel.getAdminVarianProduk(id);

        return res.status(200).json({
            pesan: 'Data produk berhasil diambil',
            data: {
                produk: produkResult[0], // karena hanya satu produk berdasarkan ID
                varian: varianResult
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};

//fungsi untuk menghapus produk oleh admin
const adminDeleteProduk = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Hapus produk dari database
        await dbModel.deleteAdminProduk(id);
        res.status(200).json({ pesan: 'Produk berhasil dihapus' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// fungsi untuk menghapus varian produk oleh admin
const adminDeleteVarianProduk = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Hapus varian produk dari database
        await dbModel.deleteAdminVarianProduk(id);
        res.status(200).json({ pesan: 'Varian produk berhasil dihapus' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data hasil transaksi online admin
const adminTampilHasilTransaksiOnline = async (req, res) => {
    try {
        const [rows] = await dbModel.getAdminTampilHasilTransaksiOnline();
        if (rows.length === 0) {
            return res.status(404).json({ pesan: 'Data transaksi online tidak ditemukan' });
        }

        const groupedData = {};

        rows.forEach(item => {
            const orderId = item.id_orderan;

            if (!groupedData[orderId]) {
                groupedData[orderId] = {
                    id_orderan: item.id_orderan,
                    nama_pengguna: item.nama_pengguna,
                    status: item.status,
                    tanggal_order: timeMoment(item.tanggal_order).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
                    total_harga: item.total_harga,
                    produk: []
                };
            }

            groupedData[orderId].produk.push({
                jumlah_order: item.jumlah_order,
                nama_produk: item.nama_produk,
                harga_satuan: item.harga_satuan,
                warna: item.warna,
                ukuran: item.ukuran
            });
        });

        return res.status(200).json({
            pesan: 'Data transaksi online berhasil diambil',
            data: Object.values(groupedData)
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};

//fungsi untuk menampilkan produk eco
const adminTampilProdukEco = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilProdukEco();
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Produk tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'Data produk berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menambahkan harga asli dan status produk eco
const adminTambahHargaProdukEco = async (req, res) => {
    try {
        const { id_produk, harga_asli } = req.body;

        if (!id_produk || !harga_asli) {
            return res.status(400).json({
                pesan: 'Data tidak lengkap. Harap isi ID produk dan harga asli.',
            });
        }
        await dbModel.postAdminTambahProdukEco(id_produk,harga_asli);

        res.status(201).json({
            pesan: 'Berhasil ditambahkan',
        });
    } catch (error) {
        console.error('Error saat menambahkan produk_eco:', error);
        res.status(500).json({
            pesan: 'Terjadi kesalahan saat menambahkan produk_eco',
        });
    }
}

//fungsi untuk mengubah harga asli produk eco
const adminUpdateHargaProdukEco = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id_produk dari parameter URL
        const { harga_asli } = req.body;

        console.log("ID Produk:", id);
        console.log("Harga Asli:", harga_asli);

        if (!id || !harga_asli) {
            return res.status(400).json({
                pesan: 'Data tidak lengkap. Harap isi ID produk dan harga asli.',
            });
        }
        await dbModel.updateAdminUbahProdukEco(id,harga_asli);

        res.status(201).json({
            pesan: 'Berhasil diubah',
        });
    } catch (error) {
        console.error('Error saat mengubah produk_eco:', error);
        res.status(500).json({
            pesan: 'Terjadi kesalahan saat mengubah produk_eco',
        });
    }
}

// //fungsi untuk menampilkan data hasil transaksi online admin
// const adminTampilHasilTransaksiPenjualanHarianOnline = async (req, res) => {
//     try {
//         const [data] = await dbModel.getAdminTampilPenjualanHarianOnline();
//         if (data.length === 0) {
//             return res.status(404).json({ pesan: 'Data transaksi online tidak ditemukan' });
//         }
        
//         return res.status(200).json({ pesan: 'Data transaksi online berhasil diambil', data:
//             data.map((item) => ({
//                 ...item,
//                 tanggal_order: timeMoment(item.tanggal_order).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
//             })),
//          });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ pesan: 'Internal server error' });
//     }
// }

// // fungsi untuk menampilkan data hasil transaksi offline admin
// const adminTampilHasilTransaksiPenjualanHarianOffline = async (req, res) => {
//     try {
//         const [data] = await dbModel.getAdminTampilPenjualanHarianOffline();
//         if (data.length === 0) {
//             return res.status(404).json({ pesan: 'Data transaksi offline tidak ditemukan' });
//         }
        
//         return res.status(200).json({ pesan: 'Data transaksi offline berhasil diambil', data:
//             data.map((item) => ({
//                 ...item,
//                 tanggal: timeMoment(item.tanggal).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
//             })),
//          });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ pesan: 'Internal server error' });
//     }
// }

const adminTampilSemuaHasilTransaksiPenjualanHarian = async (req, res) => {
  try {
    // Ambil data online dan offline secara paralel
    const [dataOnlineResponse, dataOfflineResponse] = await Promise.all([
      dbModel.getAdminTampilPenjualanHarianOnline(),
      dbModel.getAdminTampilPenjualanHarianOffline(),
    ]);

    const dataOnline = dataOnlineResponse[0] || [];
    const dataOffline = dataOfflineResponse[0] || [];

    // Format data online: Kelompok berdasarkan id_orderan
    const groupedOnline = {};

    dataOnline.forEach(item => {
      const formattedTanggal = timeMoment(item.tanggal_order)
        .tz('Asia/Makassar')
        .format('YYYY-MM-DD HH:mm:ss');

      if (!groupedOnline[item.id_orderan]) {
        groupedOnline[item.id_orderan] = {
          id_orderan: item.id_orderan,
          nama_pengguna: item.nama_pengguna,
          tanggal_order: formattedTanggal,
          total_harga: item.total_harga,
          produk: [],
        };
      }

      groupedOnline[item.id_orderan].produk.push({
        nama_produk: item.nama_produk,
        jumlah_order: item.jumlah_order,
        harga_satuan: item.harga_satuan, // hitung harga per item
        warna: item.warna,
        ukuran: item.ukuran,
        link_gambar_varian: item.link_gambar_varian,
      });
    });

    const formattedDataOnline = Object.values(groupedOnline);

    // Format data offline
    const formattedDataOffline = dataOffline.map(item => ({
      ...item,
      tanggal: timeMoment(item.tanggal)
        .tz('Asia/Makassar')
        .format('YYYY-MM-DD HH:mm:ss'),
    }));

    return res.status(200).json({
      pesan: 'Data transaksi berhasil diambil',
      data_online: formattedDataOnline,
      data_offline: formattedDataOffline,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ pesan: 'Internal server error' });
  }
};

  
  const adminLaporanHarian = async (req, res) => {
    try {
        // Ambil data penjualan online dan offline
        const [onlineResults] = await dbModel.getAdminLaporanTotalHargaOnline();
        const [offlineResults] = await dbModel.getAdminLaporanTotalHargaOffline();
        // Ambil data gaji karyawan
        const [gajiResults] = await dbModel.getGajiKaryawan();

        if (onlineResults.length === 0 && offlineResults.length === 0) {
            return res.status(404).json({ pesan: 'Data laporan tidak ditemukan' });
        }

        // Hitung total gaji harian (total gaji dibagi 30 hari)
        let totalGajiHarian = 0;
        if (gajiResults.length > 0) {
            const totalGaji = gajiResults.reduce((sum, gaji) => sum + parseInt(gaji.gaji, 10), 0);
            totalGajiHarian = Math.round(totalGaji / 30); // Pembulatan untuk hasil yang lebih bersih
        }

        // Gabungkan hasil laporan berdasarkan tanggal
        const laporan = [];
        let i = 0, j = 0;

        while (i < offlineResults.length || j < onlineResults.length) {
            const offline = offlineResults[i];
            const online = onlineResults[j];

            let tanggal, total_penjualan_offline, total_penjualan_online;
            let keuntungan_penjualan_offline = 0, keuntungan_penjualan_online = 0;

            if (offline && (!online || offline.tanggal < online.tanggal)) {
                tanggal = offline.tanggal;
                total_penjualan_offline = offline.total_penjualan;
                keuntungan_penjualan_offline = offline.total_keuntungan;
                total_penjualan_online = 0;
                keuntungan_penjualan_online = 0;
                i++;
            } else if (online && (!offline || online.tanggal < offline.tanggal)) {
                tanggal = online.tanggal;
                total_penjualan_offline = 0;
                keuntungan_penjualan_offline = 0;
                total_penjualan_online = online.total_harga;
                keuntungan_penjualan_online = online.total_keuntungan;
                j++;
            } else {
                tanggal = offline.tanggal;
                total_penjualan_offline = offline.total_penjualan;
                keuntungan_penjualan_offline = offline.total_keuntungan;
                total_penjualan_online = online.total_harga;
                keuntungan_penjualan_online = online.total_keuntungan;
                i++;
                j++;
            }

            // Format tanggal menggunakan moment-timezone dengan timezone Asia/Makassar
            const formattedTanggal = timeMoment(tanggal).tz('Asia/Makassar').format('YYYY-MM-DD');

            // Pastikan total penjualan offline dan online adalah angka, bukan string
            total_penjualan_offline = parseInt(total_penjualan_offline, 10);
            total_penjualan_online = parseInt(total_penjualan_online, 10);
            keuntungan_penjualan_offline = parseInt(keuntungan_penjualan_offline, 10);
            keuntungan_penjualan_online = parseInt(keuntungan_penjualan_online, 10);

            // Hitung total harga harian dan total keuntungan harian
            const total_harian = total_penjualan_offline + total_penjualan_online;
            const total_keuntungan_harian = keuntungan_penjualan_offline + keuntungan_penjualan_online;

            // Hitung keuntungan bersih setelah dikurangi gaji karyawan harian
            const keuntungan_bersih = total_keuntungan_harian - totalGajiHarian;

            laporan.push({
                tanggal: formattedTanggal,
                total_penjualan_offline,
                total_penjualan_online,
                keuntungan_penjualan_offline,
                keuntungan_penjualan_online,
                total_harian,
                total_keuntungan_harian,
                gaji_karyawan_harian: totalGajiHarian,
                keuntungan_bersih
            });
        }

        return res.status(200).json({
            pesan: 'Data laporan berhasil diambil',
            data: laporan
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};

// fungsi untuk menampilkan data metode pembayaran
const adminTampilMetodePembayaran = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminMetodePembayaran();
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data metode pembayaran tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'Data metode pembayaran berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// fungsi untuk menampilkan keranjang pembeli
const pembeliTampilKeranjang = async (req, res) => {
    try {
        const  id_pengguna  = req.user.id; // Mengambil id dari parameter URL

        // Mengambil data keranjang pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getPembeliTampilKeranjang(id_pengguna);

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Keranjang tidak ditemukan' });
        }

        // Mengembalikan data keranjang
        return res.status(200).json({ pesan: 'Keranjang berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menghapus keranjang pembeli
const pembeliDeleteKeranjang = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Ambil data item_order berdasarkan id
        const [rows] = await dbModel.getItemOrderById(id);
        // Cek apakah item_order ditemukan
        console.log("Rows:", rows);
        if (rows.length === 0) {
            return res.status(404).json({ pesan: 'Item keranjang tidak ditemukan' });
        }

        const { id_varian_produk, jumlah_order } = rows[0];

        // 2. Tambahkan kembali stok ke varian_produk
        await dbModel.kembalikanStokVarianProduk(id_varian_produk, jumlah_order);

        // 3. Hapus item_order
        await dbModel.deletePembeliKeranjang(id);

        return res.status(200).json({ pesan: 'Produk berhasil dihapus dari keranjang dan stok dikembalikan' });
    } catch (error) {
        console.error('Error saat menghapus keranjang:', error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};


//fungsi untuk admin menambahkan metode pembayaran
const adminTambahMetodePembayaran = async (req, res) => {
    try {
        const { nama_metode, deskripsi } = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!nama_metode || !deskripsi ) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.postAdminMetodePembayaran(nama_metode, deskripsi);
        res.status(201).json({ pesan: 'Metode pembayaran berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk admin mengubah atau mengupdate metode pembayaran
const adminUpdateMetodePembayaran = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { nama_metode, deskripsi } = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!nama_metode || !deskripsi) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAdminMetodePembayaran(id, nama_metode, deskripsi);
        res.status(200).json({ pesan: 'Metode pembayaran berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// fungsi untuk menhapus metode pembayaran
const adminDeleteMetodePembayaran = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Hapus metode pembayaran berdasarkan id
        await dbModel.deleteAdminMetodePembayaran(id);
        res.status(200).json({ pesan: 'Metode pembayaran berhasil dihapus' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data verifikasi pembayaran
const adminTampilVerifikasiPembayaran = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilVerifikasiPembayaran();

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data verifikasi pembayaran tidak ditemukan' });
        }

        // Proses pengelompokan berdasarkan id_orderan
        const groupedData = Object.values(data.reduce((acc, item) => {
            const id = item.id_orderan;

            if (!acc[id]) {
                acc[id] = {
                    id_orderan: id,
                    status: item.status,
                    catatan_admin: item.catatan_admin,
                    nama_pengirim: item.nama_pengirim,
                    bank_pengirim: item.bank_pengirim,
                    tanggal_transfer: timeMoment(item.tanggal_transfer).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
                    bukti_transfer: [item.bukti_transfer]
                };
            } else {
                acc[id].bukti_transfer.push(item.bukti_transfer);
            }

            return acc;
        }, {}));

        return res.status(200).json({ 
            pesan: 'Data verifikasi pembayaran berhasil diambil', 
            data: groupedData 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};

//fungsi untuk mengupdate status verifikasi pembayaran
const adminUpdateVerifikasiPembayaran = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { status, catatan_admin } = req.body; // Mengambil status dari body request

        // Validasi Pastikan semua field diisi
        if (!status) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAdminVerifikasiPembayaran(id, status, catatan_admin);
        res.status(200).json({ pesan: 'Status verifikasi pembayaran berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// fungsi untuk menampilkan data faktur online admin
const adminTampilFakturOnline = async (req, res) => {
    try {
        const [rows] = await dbModel.getAdminTampilFakturOnline();

        if (rows.length === 0) {
            return res.status(404).json({ pesan: 'Data faktur online tidak ditemukan' });
        }

        // Grup berdasarkan nomor_faktur
        const fakturMap = new Map();

        rows.forEach(item => {
            const fakturKey = item.nomor_faktur;

            if (!fakturMap.has(fakturKey)) {
                fakturMap.set(fakturKey, {
                    nomor_faktur: item.nomor_faktur,
                    tanggal_faktur: moment(item.tanggal_faktur).locale('id').format('DD MMMM YYYY, HH:mm'),
                    id: item.id,
                    nama_pengguna: item.nama_pengguna,
                    alamat_pengiriman : item.alamat_pengiriman,
                    items: []
                });
            }

            fakturMap.get(fakturKey).items.push({
                nama_barang: item.nama_barang,
                warna: item.warna,
                ukuran: item.ukuran,
                jumlah_order: item.jumlah_order,
                harga: item.harga
            });
        });

        const data = Array.from(fakturMap.values());

        return res.status(200).json({
            pesan: 'Data faktur online berhasil diambil',
            data: data
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};

//fungsi untuk menampilkan data ulasan setiap produk
const adminTampilUlasanProduk = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const [data] = await dbModel.getAdminTampilUlasanProduk(id);
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Ulasan produk tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'Data ulasan produk berhasil diambil', data: data.map((item) => ({
            ...item,
            tanggal_komentar: timeMoment(item.tanggal).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
        })) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data produk yang harus di restok oleh admin
const adminTampilProdukPerluRestok = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilProdukPerluRestok();
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data produk tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'Data produk berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

const adminTampilPengiriman = async (req, res) => {
    try {
        const [rows] = await dbModel.getAdminTampilPengiriman();

        if (rows.length === 0) {
            return res.status(404).json({ pesan: 'Data pengiriman tidak ditemukan' });
        }

        const grouped = {};

        rows.forEach(row => {
            const {
                id_pengiriman,
                alamat_pengiriman,
                status_pengiriman,
                tanggal_pengiriman,
                nama_pengguna,
                nama,
                warna,
                ukuran,
                harga_satuan,
                total_harga,
                jumlah_order
            } = row;

            if (!grouped[id_pengiriman]) {
                grouped[id_pengiriman] = {
                    id_pengiriman,
                    nama_pengguna,
                    alamat_pengiriman,
                    status_pengiriman,
                                    total_harga,
                    // Format tanggal menggunakan timeMoment
                    tanggal_pengiriman: timeMoment(tanggal_pengiriman).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
                    items: []
                };
            }

            grouped[id_pengiriman].items.push({
                nama,
                warna,
                ukuran,
                harga_satuan,
                jumlah_order
            });
        });

        const result = Object.values(grouped);

        return res.status(200).json({ pesan: 'Data pengiriman berhasil diambil', data: result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};

//fungsi untuk menampilkan data pengiriman detail
const adminTampilPengirimanDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await dbModel.getAdminTampilPengirimanDetail(id);

        if (rows.length === 0) {
            return res.status(404).json({ pesan: 'Data pengiriman tidak ditemukan' });
        }

        const {
            id_pengiriman,
            nama_pengguna,
            alamat_pengiriman,
            total_harga,
            status_pengiriman,
            tanggal_pengiriman
        } = rows[0];

        const formattedData = {
            id_pengiriman,
            nama_pengguna,
            alamat_pengiriman,
            status_pengiriman,
            total_harga,
            tanggal_pengiriman: timeMoment(tanggal_pengiriman).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
            items: rows.map(item => ({
                nama: item.nama,
                warna: item.warna,
                ukuran: item.ukuran,
                harga_satuan: item.harga_satuan,
                jumlah_order: item.jumlah_order
            }))
        };

        return res.status(200).json({
            pesan: 'Detail pengiriman berhasil diambil',
            data: formattedData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};

//fungsi untuk mengupdate status pengiriman
const adminUpdatePengiriman = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { status_pengiriman } = req.body; // Mengambil status dari body request

        console.log("ID Pengiriman:", id);
        console.log("Status Pengiriman:", status_pengiriman);

        // Validasi Pastikan semua field diisi
        if (!status_pengiriman) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAdminStatusPengiriman(id, status_pengiriman);
        res.status(200).json({ pesan: 'Status pengiriman berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data akun dari admin
const adminTampilDataAkun = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilDataAkun();
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data akun tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'Data akun berhasil diambil', data: data.map((item) => ({
            ...item,
            created_at: timeMoment(item.created_at).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
        }))
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menambahkan data akun dari admin
const adminTambahAkun = async (req, res) => {
    try {
        const { username, password, nama_lengkap, nomor_telepon, email, role } = req.body; // Mengambil data dari body request

        console.log("Username:", username);
        console.log("Password:", password);
        console.log("Nama Lengkap:", nama_lengkap);
        console.log("Nomor Telepon:", nomor_telepon);
        console.log("Email:", email);
        console.log("Role:", role);

        // Validasi Pastikan semua field diisi
        if (!username || !password || !nama_lengkap || !nomor_telepon || !email || !role) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        //cek apakah username / email sudah ada
        const [existingUser] = await dbModel.getAdminCekDataAkun(username, email);
        // Jika username sudah ada, kembalikan pesan error
        if (existingUser.length > 0) {
            return res.status(400).json({ pesan: 'Username sudah terdaftar' });
        }


        // Simpan data ke database
        await dbModel.postAdminDataAkun(username, password, nama_lengkap, email, nomor_telepon, email);
        res.status(201).json({ pesan: 'Akun berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk mengupdate data akun dari admin
const adminUpdateAkun = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { username, password, nama_lengkap, nomor_telepon, email, role } = req.body; // Mengambil data dari body request

        console.log("ID:", id);
        console.log("Username:", username);
        console.log("Password:", password);
        console.log("Nama Lengkap:", nama_lengkap);
        console.log("Nomor Telepon:", nomor_telepon);
        console.log("Email:", email);
        console.log("Role:", role);

        // Validasi Pastikan semua field diisi
        if (!username || !password || !nama_lengkap || !nomor_telepon || !email || !role) {
            return res.status(400).json({ pesan: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAdminDataAkun(id, username, password, nama_lengkap,email, nomor_telepon, role);
        res.status(200).json({ pesan: 'Akun berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menghapus data akun dari admin
const adminDeleteAkun = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Hapus akun berdasarkan id
        await dbModel.deleteAdminDataAkun(id);
        res.status(200).json({ pesan: 'Akun berhasil dihapus' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menampilkan riwayat chat
const chat = async (req, res) => {
    try {
        const id_user = req.user.id;
        const id_lawan = req.params.id;

        console.log(`ID User: ${id_user}, ID Lawan: ${id_lawan}`);

        // Ambil semua chat antara user dan lawan bicara
        const [data] = await dbModel.getChat(id_user, id_lawan);

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data chat tidak ditemukan' });
        }

        return res.status(200).json({
    pesan: 'Data chat berhasil diambil',
    data: data.map((item) => ({
        id_pengirim: item.id_pengirim,   // <--- tambahkan ini
        id_penerima: item.id_penerima,   // <--- dan ini
        pesan: item.pesan,
        createdAt: timeMoment(item.createdAt)
            .tz('Asia/Makassar')
            .format('YYYY-MM-DD HH:mm:ss'),
    })),
});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};


//fungsi untuk mengirimkan chat
const chatPost = async (req, res) => {
    try {
        const id_user = req.user.id;
        console.log(`ID User nyaaaa: ${id_user}`);
        
        await dbModel.postChat(
            req.body.pesan,
            id_user,
            req.body.id_penerima
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menampilkan list admin dari chat pembeli
const chatListAdmin = async (req, res) => {
    try {
        const [data] = await dbModel.getChatListAdmin();
        console.log(data);

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data chat tidak ditemukan' });
        }

        return res.status(200).json({
            pesan: 'Data chat berhasil diambil',
            data: data
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menampilkan list pembeli dari chat admin
const chatListPembeli = async (req, res) => {
    try {
        const id = req.user.id;
        console.log(`ID User nyaaaa: ${id}`);
        const [data] = await dbModel.getChatListPembeli(id);

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Data chat tidak ditemukan' });
        }

        return res.status(200).json({
            pesan: 'Data chat berhasil diambil',
            data: data
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data profile pengguna pembeli (getProfilePembeli)
const pembeliProfile = async (req, res) => {
    try {
        const id_pengguna = req.user.id; // Mengambil id dari token pengguna yang sudah di-verify

        // Mengambil data profile pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getProfilePembeli(id_pengguna);

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'Profile tidak ditemukan' });
        }

        // Mengembalikan data profile pembeli
        return res.status(200).json({ pesan: 'Profile berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk mengecek status pesanan orderan
const pembeliCekStatus = async (req, res) => {
    try {
        const {id} = req.params; // Mengambil id dari parameter URL

        // Mengambil data profile pembeli berdasarkan id_pengguna
        const [data] = await dbModel.cekStatusOrderan(id);

        if (data.length === 0) {
            return res.status(404).json({ pesan: 'data tidak ditemukan' });
        }

        // Mengembalikan data profile pembeli
        return res.status(200).json({ pesan: 'data berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk mengecek status pengiriman 
const pembeliCekPengiriman = async (req, res) => {
    try {
        const {id} = req.params; // Mengambil id dari parameter URL

        const [data] = await dbModel.cekStatusPengiriman(id);
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'data tidak ditemukan' });
        }

        return res.status(200).json({ pesan: 'data berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

//fungsi untuk mengecek komentar pembeli sudah komentar atau belum
const pembeliCekKomentar = async (req, res) => {
    try {
        const id_pengguna = req.user.id;
        const {id} = req.params;

        console.log(id_pengguna);
        console.log(id);

        const [data] = await dbModel.getPembeliKomentar(id_pengguna, id);
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'data tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'data berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// Fungsi untuk menghapus penjualan offline oleh karyawan
const karyawanDeleteProdukPenjualanOffline = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Ambil data penjualan offline berdasarkan id
        const [rows] = await dbModel.getPenjualanOfflineById(id);
        console.log("Rows:", rows);

        // 2. Cek apakah data penjualan ditemukan
        if (rows.length === 0) {
            return res.status(404).json({ pesan: 'Data penjualan tidak ditemukan' });
        }

        const { id_varian_produk, jumlah } = rows[0]; // sesuaikan field dengan struktur tabel Anda

        // 3. Kembalikan stok ke varian_produk
        await dbModel.kembalikanStokVarianProduk(id_varian_produk, jumlah);

        // 4. Hapus data penjualan offline
        await dbModel.deleteKaryawanPenjualanOffline(id); // pastikan nama fungsi sesuai

        return res.status(200).json({ pesan: 'Penjualan offline berhasil dihapus dan stok dikembalikan' });
    } catch (error) {
        console.error('Error saat menghapus penjualan offline:', error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};

const adminTampilGajiKaryawan = async (req, res) => {
    try {
        const [data] = await dbModel.getGajiKaryawan();
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'data tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'data berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}
    
const adminTambahGajiKaryawan = async (req, res) => {
    try {
        const { id, jumlah_gaji } = req.body;
        const [data] = await dbModel.postGajiKaryawan(id, jumlah_gaji);
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'data tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'data berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

const adminUpdateGajiKaryawan = async (req, res) => {
    try {
        const { id } = req.params;
        const { jumlah_gaji } = req.body;
        const [data] = await dbModel.updateGajiKaryawan(id, jumlah_gaji);
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'data tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'data berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

const adminDeleteGajiKaryawan = async (req, res) => {
    try {
        const { id } = req.params;
        const [data] = await dbModel.deleteGajiKaryawan(id);
        return res.status(200).json({ pesan: 'data berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

const adminTampilDataPenggunaKaryawan = async (req, res) => {
    try {
        const [data] = await dbModel.tampilDataPenggunaKaryawan();
        if (data.length === 0) {
            return res.status(404).json({ pesan: 'data tidak ditemukan' });
        }
        return res.status(200).json({ pesan: 'data berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
}

// Controller untuk melihat daftar pengguna pending
const getPendingUsers = async (req, res) => {
    try {
        const [data] = await dbModel.getPendingUsers();
        res.status(200).json({ data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ pesan: 'Internal server error' });
    }
};

// Controller untuk approve/reject user
const updateUserStatus = async (req, res) => {
    try {
        const { id, status } = req.body; // 'approved' atau 'rejected'

        console.log(id, status);
        
        await dbModel.updateUserStatus(id, status);
        res.status(200).json({ 
            pesan: 'Status pengguna berhasil diperbarui', 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ pesan: 'Internal server error' });
    }
};


module.exports = {
    login,
    daftar, 
    pembeliTambahKeranjang,
    pembeliOrderProduk, 
    pembeliRiwayatTransaksi,
    pembeliRiwayatTransaksiDetail,
    pembeliUlasanProduk, 
    pembeliTambahKomentar, 
    pembeliFaktur,
    getPengirimanData,
    pembeliProfilePassword,
    pembeliProfileNama,
    pembeliProfileNomorTelepon,
    pembeliProfileEmail,
    tampilProduk,
    tampilProdukDetail,
    tampilUlasanProduk,
    karyawanTampilPengajuanIzin,
    karyawanTambahPengajuanIzin,
    karyawanTambahAbsensi,
    karyawanTampilTambahPenjualanOffline,
    karyawanTambahPenjualanOffline,
    adminTampilKaryawanAbsensi,
    adminTampilKaryawanIzin,
    adminTampilKaryawanIzinDetail,
    adminUpdateKaryawanIzin,
    adminTambahProduk,
    adminUpdateProduk,
    adminTampilUpdateProduk,
    adminDeleteProduk,
    adminDeleteVarianProduk,
    adminTampilHasilTransaksiOnline,
    adminTampilProdukEco,
    adminTambahHargaProdukEco,
    adminUpdateHargaProdukEco,
    // adminTampilHasilTransaksiPenjualanHarianOnline,
    // adminTampilHasilTransaksiPenjualanHarianOffline,
    adminTampilSemuaHasilTransaksiPenjualanHarian,
    adminLaporanHarian,
    adminTampilMetodePembayaran,
    pembeliTampilKeranjang,
    pembeliDeleteKeranjang,
    adminTambahMetodePembayaran,
    adminUpdateMetodePembayaran,
    adminDeleteMetodePembayaran,
    adminTampilVerifikasiPembayaran,
    adminUpdateVerifikasiPembayaran,
    adminTampilFakturOnline,
    adminTampilUlasanProduk,
    adminTampilProdukPerluRestok,
    adminTampilPengiriman,
    adminTampilPengirimanDetail,
    adminUpdatePengiriman,
    adminTampilDataAkun,
    adminTambahAkun,
    adminUpdateAkun,
    chat,
    chatPost,
    adminDeleteAkun,
    authenticateToken,
    chatListAdmin,
    chatListPembeli,
    pembeliProfile,
    pembeliCekStatus,
    pembeliCekPengiriman,
    pembeliCekKomentar,
    karyawanDeletePengajuanIzin,
    karyawanDeleteProdukPenjualanOffline,
    adminTampilGajiKaryawan,
    adminTambahGajiKaryawan,
    adminUpdateGajiKaryawan,
    adminDeleteGajiKaryawan,
    adminTampilDataPenggunaKaryawan,
    getPendingUsers,
    updateUserStatus
}