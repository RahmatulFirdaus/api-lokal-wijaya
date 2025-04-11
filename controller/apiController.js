const dbModel = require('../model/apiModel');
const timeMoment = require('moment-timezone');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Fungsi untuk menghasilkan token JWT
const generateToken = (pengguna) => {
    console.log("ID:", pengguna.id);
    console.log("Username:", pengguna.username);
    console.log("Role:", pengguna.role);
    return jwt.sign(
        { id: pengguna.id, username: pengguna.username, role: pengguna.role }
        , process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Fungsi untuk menangani login
const login = async (req, res) => {
    try {
        // pada body request, kita ambil username dan password
        const { username, password } = req.body;

        // jika username dan password kosong, kita kembalikan error
        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan Password tidak ditemukan' });
        }
        // jika username dan password ada, kita ambil data user dari database
        const [data] = await dbModel.getUsernameLogin(username);
        if (data.length === 0) {
            return res.status(401).json({ message: 'Username tidak ditemukan' });
        }
        // jika user ditemukan, kita cek passwordnya
        const user = data[0];
        if (user.password !== password) {
            return res.status(401).json({ message: 'Password salah' });
        }

        const token = generateToken(user);

        // jika password benar, kita kembalikan data user
        return res.status(200).json({ message: 'Login berhasil',
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
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const daftar = async (req, res) => {
    try {
        // Ambil data dari body request
        const { username, password, nama, email, confirmPassword, no_telp } = req.body;

        // Validasi Pastikan semua field diisi
        if (!username || !password || !nama || !email || !confirmPassword || !no_telp) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Validasi: Pastikan password dan confirmPassword cocok
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Password dan Konfirmasi Password tidak cocok' });
        }

        // Periksa apakah username atau email sudah terdaftar
        const [data] = await dbModel.validasiDaftar(username, email);
        if (data.length > 0) {
            return res.status(400).json({ message: 'Username atau Email sudah terdaftar' });
        }
        // Simpan data pengguna baru ke database
        await dbModel.postDaftar(username, password, nama, email, no_telp);
        res.status(201).json({ message: 'Pendaftaran berhasil' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Fungsi untuk menambahkan produk ke keranjang
const pembeliTambahKeranjang = async (req, res) => {
    try {
        // Ambil data dari body request
        const { id_pengguna, id_varian_produk, jumlah_order, harga } = req.body;

        console.log("ID Pengguna:", id_pengguna);
        console.log("ID Varian Produk:", id_varian_produk); 
        console.log("Jumlah Order:", jumlah_order);
        console.log("Harga:", harga);

        // Validasi Pastikan semua field diisi
        if (!id_pengguna || !id_varian_produk || !jumlah_order || !harga) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke keranjang
        await dbModel.postPembeliTambahKeranjang(id_pengguna, id_varian_produk, jumlah_order, harga);
        res.status(201).json({ message: 'Produk berhasil ditambahkan ke keranjang' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Fungsi untuk menghasilkan nomor faktur
// Format: FAK-YYYYMMDDHHmmss-RANDOM_NUMBER
const generateNomorFaktur = () => {
    const tanggal = timeMoment().tz('Asia/Jakarta').format('YYYYMMDDHHmmss');
    const randomAngka = Math.floor(1000 + Math.random() * 9000); // 4 digit acak
    return `FAK-${tanggal}-${randomAngka}`;
};

// Fungsi untuk menangani proses pemesanan produk oleh pembeli
const pembeliOrderProduk = async (req, res) => {
    try {
        // Ambil data dari body request
        const {
            id_pengguna, // ID pengguna yang melakukan pemesanan
            id_metode_pembayaran, // ID metode pembayaran yang dipilih
            total_harga, // Total harga pesanan
            nama_pengirim, // Nama pengirim untuk pembayaran
            bank_pengirim // Bank pengirim untuk pembayaran
        } = req.body;

        // Ambil nama file bukti transfer jika ada file yang diunggah
        const bukti_transfer = req.file ? req.file.filename : null;

        // Mengecek apakah ada item order yang belum dibayar untuk pengguna
        const [data] = await dbModel.cekIdOrderKosong(id_pengguna);
        if (data.length === 0) {
            // Jika tidak ada item order yang belum dibayar, kembalikan respons error
            return res.status(401).json({ message: 'Tidak ada item order yang belum dibayar' });
        }

        // Simpan data ke tabel order_produk
        const [resultOrder] = await dbModel.postPembeliOrderProduk(id_metode_pembayaran, total_harga);

        console.log("Berhasil Simpan Order Produk");

        // Ambil ID order yang baru saja disimpan
        const id_order = resultOrder.insertId;

        // Update ID order di tabel item_order untuk menghubungkan item dengan order
        await dbModel.updateItemOrder(id_order, id_pengguna);

        console.log("Berhasil Update Order Produk");

        // Simpan data pembayaran ke tabel pembayaran
        await dbModel.postDataPembayaranPembeli(id_order, nama_pengirim, bank_pengirim, bukti_transfer);

        const nomor_faktur = generateNomorFaktur();
        await dbModel.postFakturPembeli(id_order, nomor_faktur);

        // Kembalikan respons sukses
        res.status(201).json({ message: 'Produk berhasil dipesan' });
    } catch (error) {
        // Tangani error dan kembalikan respons error
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Fungsi untuk mengambil riwayat transaksi pembeli berdasarkan ID pengguna
const pembeliRiwayatTransaksi = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getPembeliRiwayatTransaksi(id);

        if (data.length === 0) {
            return res.status(404).json({ message: 'Riwayat transaksi tidak ditemukan' });
        }

        // Mengembalikan data riwayat transaksi
        return res.status(200).json({ message: 'Riwayat transaksi berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Fungsi untuk mengambil detail riwayat transaksi pembeli berdasarkan ID Orderan
const pembeliRiwayatTransaksiDetail = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getPembeliRiwayatTransaksiDetail(id);

        if (data.length === 0) {
            return res.status(404).json({ message: 'Riwayat transaksi tidak ditemukan' });
        }

        // Mengembalikan data riwayat transaksi
        return res.status(200).json({ message: 'Riwayat transaksi berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const pembeliUlasanProduk = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getPembeliUlasanProduk(id);

        console.log("Data:", data);

        if (data.length === 0) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        // Mengembalikan data riwayat transaksi
        return res.status(200).json({ message: 'Transaksi ditemukan', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Fungsi untuk menambahkan komentar oleh pembeli
const pembeliTambahKomentar = async (req, res) => {
    try {
        const { id_produk, id_pengguna, rating, komentar } = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!id_produk || !id_pengguna || !rating || !komentar) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data komentar ke database
        await dbModel.postPembeliTambahKomentar(id_produk, id_pengguna, rating, komentar);
        res.status(201).json({ message: 'Ulasan berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const pembeliFaktur = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getFakturPembeli(id);

        if (data.length === 0) {
            return res.status(404).json({ message: 'Faktur tidak ditemukan' });
        }

        // Mengembalikan data riwayat transaksi
        return res.status(200).json({ message: 'Faktur berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const getPengirimanData = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL


    console.log("ID Pengiriman:", id);  
        // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getPengiriman(id);

        console.log("Data Pengiriman:", data);

        if (data.length === 0) {
            return res.status(404).json({ message: 'Riwayat transaksi tidak ditemukan' });
        }

        // Mengembalikan data riwayat transaksi
        return res.status(200).json({ message: 'Riwayat transaksi berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Fungsi untuk mengupdate profile pembeli
const pembeliProfile = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { password, nama, email, nomor_telp } = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!password || !nama || !email || !nomor_telp) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateProfile(id, password, nama, email, nomor_telp);
        res.status(200).json({ message: 'Profile berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
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
    pembeliProfile
}