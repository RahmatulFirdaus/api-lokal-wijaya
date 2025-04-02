const dbModel = require('../model/apiModel');
const timeMoment = require('moment-timezone');


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
        // jika password benar, kita kembalikan data user
        return res.status(200).json({ message: 'Login berhasil',
             data: data
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

module.exports = {
    login,
    daftar
}