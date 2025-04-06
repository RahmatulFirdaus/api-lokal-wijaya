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

//Fungsi Order Produk Pembeli
const pembeliOrderProduk = async (req, res) => {
    try {
        // Ambil data dari body request
        const {
            id_pengguna,
            id_metode_pembayaran,
            total_harga,
            nama_pengirim,
            bank_pengirim
          } = req.body;

        const bukti_transfer = req.file ? req.file.filename : null;

        //mengecek id_order yang kosong di item_order
        const [data] = await dbModel.cekIdOrderKosong(id_pengguna);
        if (data.length === 0) {
            return res.status(401).json({ message: 'Tidak ada item order yang belum dibayar' });
        }

        const id_order = data[0].id_order;
        console.log("ID Order:", id_order);
        // Simpan data ke tabel order_produk
        await dbModel.postPembeliOrderProduk(id_metode_pembayaran, total_harga);

        //update id_order di item_order
        await dbModel.updateItemOrder(id_order, id_pengguna);

        // Simpan data pembayaran ke tabel pembayaran
        await dbModel.postDataPembayaranPembeli(id_order, nama_pengirim, bank_pengirim, bukti_transfer);
        res.status(201).json({ message: 'Produk berhasil dipesan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    login,
    daftar, 
    pembeliTambahKeranjang,
    pembeliOrderProduk
}