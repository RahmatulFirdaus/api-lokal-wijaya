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
        const { id_pengguna, id_varian_produk, jumlah_order } = req.body;

        console.log("ID Pengguna:", id_pengguna);
        console.log("ID Varian Produk:", id_varian_produk); 
        console.log("Jumlah Order:", jumlah_order);

        if (!id_pengguna || !id_varian_produk || !jumlah_order) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Ambil stok saat ini dari database
        const [stokRows] = await dbModel.getStokVarianProduk(id_varian_produk);

        if (stokRows.length === 0) {
            return res.status(404).json({ message: 'Varian produk tidak ditemukan' });
        }

        const stokSaatIni = stokRows[0].stok;

        // Cek apakah stok cukup
        if (stokSaatIni < jumlah_order) {
            return res.status(400).json({ message: `Stok tidak mencukupi. Stok saat ini: ${stokSaatIni}` });
        }

        // Simpan ke keranjang dan kurangi stok
        await dbModel.postPembeliTambahKeranjang(id_pengguna, id_varian_produk, jumlah_order);
        await dbModel.updateStokVarianProduk(id_varian_produk, jumlah_order);

        return res.status(201).json({ message: 'Produk berhasil ditambahkan ke keranjang' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
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
        // Ambil data dari body request
        const {
            id_pengguna, // ID pengguna yang melakukan pemesanan
            id_metode_pembayaran, // ID metode pembayaran yang dipilih
            total_harga, // Total harga pesanan
            nama_pengirim, // Nama pengirim untuk pembayaran
            bank_pengirim, // Bank pengirim untuk pembayaran
            alamat_pengiriman // Alamat pengiriman untuk produk
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

        //Simpan data ke tabel pengiriman
        await dbModel.postPengiriman(id_order, alamat_pengiriman);

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
        console.log("Data Faktur:", data);

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

// Fungsi untuk menangani pembeli yang ingin mengupdate profile password
const pembeliProfilePassword = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { password } = req.body; // Mengambil password dari body request

        // Validasi Pastikan semua field diisi
        if (!password) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAkunPembeliPassword(id, password);
        res.status(200).json({ message: 'Password berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Fungsi untuk menangani pembeli yang ingin mengupdate profile nama
const pembeliProfileNama = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { nama } = req.body; // Mengambil nama dari body request

        // Validasi Pastikan semua field diisi
        if (!nama) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAkunPembeliNama(id, nama);
        res.status(200).json({ message: 'Nama berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Fungsi untuk menangani pembeli yang ingin mengupdate profile nomor telepon
const pembeliProfileNomorTelepon = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { nomor_telp } = req.body; // Mengambil nomor telepon dari body request

        // Validasi Pastikan semua field diisi
        if (!nomor_telp) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAkunPembeliNomorTelepon(id, nomor_telp);
        res.status(200).json({ message: 'Nomor telepon berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Fungsi untuk menangani pembeli yang ingin mengupdate profile email
const pembeliProfileEmail = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { email } = req.body; // Mengambil email dari body request

        // Validasi Pastikan semua field diisi
        if (!email) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAkunPembeliEmail(id, email);
        res.status(200).json({ message: 'Email berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//Fungsi untuk tampil produk
const tampilProduk = async (req, res) => {
    try {
        const [data] = await dbModel.getTampilProduk();
        if (data.length === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data produk berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//Fungsi untuk tampil produk detail
const tampilProdukDetail = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const [data] = await dbModel.getTampilProdukDetail(id);
        if (data.length === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data produk berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Fungsi untuk menampilkan ulasan produk
const tampilUlasanProduk = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const [data] = await dbModel.getTampilUlasanProduk(id);
        if (data.length === 0) {
            return res.status(404).json({ message: 'Ulasan produk tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data ulasan produk berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data karyawan pengajuan
const karyawanTampilPengajuanIzin = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const [data] = await dbModel.getPengajuanIzinKaryawan(id);
        if (data.length === 0) {
            return res.status(404).json({ message: 'Pengajuan izin tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data pengajuan izin berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk karyawan tambah pengajuan izin
const karyawanTambahPengajuanIzin = async (req, res) => {
    try {
        const { id_pengguna, tipe_izin, deskripsi, tanggal_mulai, tanggal_akhir } = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!id_pengguna || !tipe_izin || !deskripsi || !tanggal_mulai || !tanggal_akhir) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.postKaryawanTambahPengajuanIzin(id_pengguna, tipe_izin, deskripsi, tanggal_mulai, tanggal_akhir);
        res.status(201).json({ message: 'Pengajuan izin berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk karyawan tambah absensi, jika hari ini sudah absen, maka tidak bisa absen lagi
const karyawanTambahAbsensi = async (req, res) => {
    try {
        const { id_pengguna } = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!id_pengguna) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Cek apakah karyawan sudah absen hari ini
        const [data] = await dbModel.cekAbensiKaryawan(id_pengguna);
        if (data.length > 0) {
            return res.status(400).json({ message: 'Anda sudah melakukan absen hari ini' });
        }
        console.log("ID Pengguna:", id_pengguna);
        console.log("Data:", data);

        // Simpan data ke database
        await dbModel.postKaryawanTambahAbsensi(id_pengguna);
        res.status(201).json({ message: 'Absensi berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk tampil data karyawan penjualan offline
const karyawanTambahProdukPenjualanOffline = async (req, res) => {
    try {
        const [data] = await dbModel.getKaryawanPenjualanOffline();
        if (data.length === 0) {
            return res.status(404).json({ message: 'Data penjualan offline tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data penjualan offline berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk karyawan tambah penjualan offline
const karyawanTambahPenjualanOffline = async (req, res) => {
    try {
        const { id_varian_produk, id_pengguna } = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!id_varian_produk || !id_pengguna) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.postKaryawanTambahPenjualanOffline(id_varian_produk, id_pengguna);
        res.status(201).json({ message: 'Penjualan offline berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk tampil data absensi karyawan pada admin
const adminTampilKaryawanAbsensi = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilAbsensiKaryawan();
        if (data.length === 0) {
            return res.status(404).json({ message: 'Data absensi karyawan tidak ditemukan' });
        }

        // Perbaikan pada penggunaan map
        return res.status(200).json({
            message: 'Data absensi karyawan berhasil diambil',
            data: data.map((item) => ({
                ...item,
                tanggal: timeMoment(item.tanggal).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
            })),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Fungsi untuk tampil data pengajuan izin karyawan pada admin
const adminTampilKaryawanIzin = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilPengajuanIzinKaryawan();
        if (data.length === 0) {
            return res.status(404).json({ message: 'Data pengajuan izin karyawan tidak ditemukan' });
        }
        

        // Format tanggal pada setiap data pengajuan izin
        return res.status(200).json({
            message: 'Data pengajuan izin karyawan berhasil diambil',
            data: data.map((item) => ({
                ...item,
                tanggal_mulai: timeMoment(item.tanggal_mulai).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
                tanggal_akhir: timeMoment(item.tanggal_akhir).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
                
            })),
            
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data pengajuan izin karyawan detail pada admin
const adminTampilKaryawanIzinDetail = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const [data] = await dbModel.getAdminTampilPengajuanIzinKaryawanDetail(id);
        if (data.length === 0) {
            return res.status(404).json({ message: 'Data pengajuan izin karyawan tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data pengajuan izin karyawan berhasil diambil',
            data: data.map((item) => ({
                ...item,
                tanggal_mulai: timeMoment(item.tanggal_mulai).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
                tanggal_akhir: timeMoment(item.tanggal_akhir).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
            })),
         });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk mengupdate pengajuan izin karyawan pada admin
const adminUpdateKaryawanIzin = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { status } = req.body; // Mengambil status dari body request

        // Validasi Pastikan semua field diisi
        if (!status) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAdminStatusPengajuanIzinKaryawan(id, status);
        res.status(200).json({ message: 'Status pengajuan izin berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk menambahkan produk dan varian produk oleh admin
const adminTambahProduk = async (req, res) => {
    try {
        const { nama_produk, deskripsi, harga_produk, link_gambar, varian } = req.body;

        // Validasi input sederhana
        if (!nama_produk || !deskripsi || !harga_produk || !link_gambar || !Array.isArray(varian)) {
            return res.status(400).json({ message: 'Data produk tidak lengkap atau format varian salah.' });
        }

        // Tambah produk
        const result = await dbModel.postAdminTambahProduk(nama_produk, deskripsi, harga_produk, link_gambar);
        const id_produk = result[0].insertId; // Ambil ID produk yang baru dimasukkan

        // Tambah varian-varian
        for (const v of varian) {
            const { warna, ukuran, stok } = v;
            await dbModel.postAdminTambahVarianProduk(id_produk, warna, ukuran, stok);
        }

        res.status(201).json({ message: 'Produk dan varian berhasil ditambahkan.' });
    } catch (error) {
        console.error('Error saat menambahkan produk:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan produk.' });
    }
}

//fungsi untuk mengubah produk dan varian produk oleh admin
const adminUpdateProduk = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_produk, deskripsi, harga_produk, link_gambar, varian } = req.body;

        if (!id || !nama_produk || !deskripsi || !harga_produk || !link_gambar || !Array.isArray(varian)) {
            return res.status(400).json({ message: 'Data tidak lengkap atau format salah.' });
        }

        // Update data utama produk
        await dbModel.updateProduk(id, nama_produk, deskripsi, harga_produk, link_gambar);

        for (const v of varian) {
            const { id_varian, warna, ukuran, stok } = v;

            if (id_varian) {
                await dbModel.updateVarianProduk(id_varian, warna, ukuran, stok);
            } else {
                await dbModel.insertVarianBaru(id, warna, ukuran, stok);
            }
        }

        res.status(200).json({ message: 'Produk dan varian berhasil diperbarui.' });
    } catch (error) {
        console.error('Error saat update produk:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui produk.' });
    }
};

//fungsi untuk menampilkan di halaman update admin produk
const adminTampilUpdateProduk = async (req, res) => {
    const { id } = req.params;
    try {
        const [produkResult] = await dbModel.getAdminProduk(id);
        if (produkResult.length === 0) {
            return res.status(404).json({ message: 'Data produk tidak ditemukan' });
        }

        const [varianResult] = await dbModel.getAdminVarianProduk(id);

        return res.status(200).json({
            message: 'Data produk berhasil diambil',
            data: {
                produk: produkResult[0], // karena hanya satu produk berdasarkan ID
                varian: varianResult
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

//fungsi untuk menghapus produk oleh admin
const adminDeleteProduk = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Hapus produk dari database
        await dbModel.deleteAdminProduk(id);
        res.status(200).json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// fungsi untuk menghapus varian produk oleh admin
const adminDeleteVarianProduk = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Hapus varian produk dari database
        await dbModel.deleteAdminVarianProduk(id);
        res.status(200).json({ message: 'Varian produk berhasil dihapus' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data hasil transaksi online admin
const adminTampilHasilTransaksiOnline = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilHasilTransaksiOnline();
        if (data.length === 0) {
            return res.status(404).json({ message: 'Data transaksi online tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data transaksi online berhasil diambil', data: 
            data.map((item) => ({
                ...item,
                tanggal_order: timeMoment(item.tanggal).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
            })),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk menampilkan produk eco
const adminTampilProdukEco = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilProdukEco();
        if (data.length === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data produk berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk menambahkan harga asli dan status produk eco
const adminTambahHargaProdukEco = async (req, res) => {
    try {
        const { id_produk, harga_asli } = req.body;

        if (!id_produk || !harga_asli) {
            return res.status(400).json({
                message: 'Data tidak lengkap. Harap isi ID produk dan harga asli.',
            });
        }
        await dbModel.postAdminTambahProdukEco(id_produk,harga_asli);

        res.status(201).json({
            message: 'Berhasil ditambahkan',
        });
    } catch (error) {
        console.error('Error saat menambahkan produk_eco:', error);
        res.status(500).json({
            message: 'Terjadi kesalahan saat menambahkan produk_eco',
        });
    }
}

//fungsi untuk mengubah harga asli produk eco
const adminUpdateHargaProdukEco = async (req, res) => {
    try {
        const { id_produk, harga_asli } = req.body;

        console.log("ID Produk:", id_produk);
        console.log("Harga Asli:", harga_asli);

        if (!id_produk || !harga_asli) {
            return res.status(400).json({
                message: 'Data tidak lengkap. Harap isi ID produk dan harga asli.',
            });
        }
        await dbModel.updateAdminUbahProdukEco(id_produk,harga_asli);

        res.status(201).json({
            message: 'Berhasil diubah',
        });
    } catch (error) {
        console.error('Error saat mengubah produk_eco:', error);
        res.status(500).json({
            message: 'Terjadi kesalahan saat mengubah produk_eco',
        });
    }
}

// //fungsi untuk menampilkan data hasil transaksi online admin
// const adminTampilHasilTransaksiPenjualanHarianOnline = async (req, res) => {
//     try {
//         const [data] = await dbModel.getAdminTampilPenjualanHarianOnline();
//         if (data.length === 0) {
//             return res.status(404).json({ message: 'Data transaksi online tidak ditemukan' });
//         }
        
//         return res.status(200).json({ message: 'Data transaksi online berhasil diambil', data:
//             data.map((item) => ({
//                 ...item,
//                 tanggal_order: timeMoment(item.tanggal_order).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
//             })),
//          });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }

// // fungsi untuk menampilkan data hasil transaksi offline admin
// const adminTampilHasilTransaksiPenjualanHarianOffline = async (req, res) => {
//     try {
//         const [data] = await dbModel.getAdminTampilPenjualanHarianOffline();
//         if (data.length === 0) {
//             return res.status(404).json({ message: 'Data transaksi offline tidak ditemukan' });
//         }
        
//         return res.status(200).json({ message: 'Data transaksi offline berhasil diambil', data:
//             data.map((item) => ({
//                 ...item,
//                 tanggal: timeMoment(item.tanggal).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
//             })),
//          });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Internal server error' });
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
  
      // Format tanggal
      const formattedDataOnline = dataOnline.map(item => ({
        ...item,
        tanggal_order: timeMoment(item.tanggal_order)
          .tz('Asia/Makassar')
          .format('YYYY-MM-DD HH:mm:ss'),
      }));
  
      const formattedDataOffline = dataOffline.map(item => ({
        ...item,
        tanggal: timeMoment(item.tanggal)
          .tz('Asia/Makassar')
          .format('YYYY-MM-DD HH:mm:ss'),
      }));
  
      return res.status(200).json({
        message: 'Data transaksi berhasil diambil',
        data_online: formattedDataOnline,
        data_offline: formattedDataOffline,
      });
      
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  const adminLaporanHarian = async (req, res) => {
    try {
        // Ambil data penjualan online dan offline
        const [onlineResults] = await dbModel.getAdminLaporanTotalHargaOnline();
        const [offlineResults] = await dbModel.getAdminLaporanTotalHargaOffline();

        if (onlineResults.length === 0 && offlineResults.length === 0) {
            return res.status(404).json({ message: 'Data laporan tidak ditemukan' });
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

            laporan.push({
                tanggal: formattedTanggal,
                total_penjualan_offline,
                total_penjualan_online,
                keuntungan_penjualan_offline,
                keuntungan_penjualan_online,
                total_harian,
                total_keuntungan_harian
            });
        }

        return res.status(200).json({
            message: 'Data laporan berhasil diambil',
            data: laporan
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// fungsi untuk menampilkan data metode pembayaran
const adminTampilMetodePembayaran = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminMetodePembayaran();
        if (data.length === 0) {
            return res.status(404).json({ message: 'Data metode pembayaran tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data metode pembayaran berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// fungsi untuk menampilkan keranjang pembeli
const pembeliTampilKeranjang = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Mengambil data keranjang pembeli berdasarkan id_pengguna
        const [data] = await dbModel.getPembeliTampilKeranjang(id);

        if (data.length === 0) {
            return res.status(404).json({ message: 'Keranjang tidak ditemukan' });
        }

        // Mengembalikan data keranjang
        return res.status(200).json({ message: 'Keranjang berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk menghapus keranjang pembeli
const pembeliDeleteKeranjang = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Ambil data item_order berdasarkan id
        const [rows] = await dbModel.getItemOrderById(id);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Item keranjang tidak ditemukan' });
        }

        const { id_varian_produk, jumlah_order } = rows[0];

        // 2. Tambahkan kembali stok ke varian_produk
        await dbModel.kembalikanStokVarianProduk(id_varian_produk, jumlah_order);

        // 3. Hapus item_order
        await dbModel.deletePembeliKeranjang(id);

        res.status(200).json({ message: 'Produk berhasil dihapus dari keranjang dan stok dikembalikan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


//fungsi untuk admin menambahkan metode pembayaran
const adminTambahMetodePembayaran = async (req, res) => {
    try {
        const { nama_metode, deskripsi } = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!nama_metode || !deskripsi ) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.postAdminMetodePembayaran(nama_metode, deskripsi);
        res.status(201).json({ message: 'Metode pembayaran berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk admin mengubah atau mengupdate metode pembayaran
const adminUpdateMetodePembayaran = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { nama_metode, deskripsi } = req.body; // Mengambil data dari body request

        // Validasi Pastikan semua field diisi
        if (!nama_metode || !deskripsi) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAdminMetodePembayaran(id, nama_metode, deskripsi);
        res.status(200).json({ message: 'Metode pembayaran berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// fungsi untuk menhapus metode pembayaran
const adminDeleteMetodePembayaran = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL

        // Hapus metode pembayaran berdasarkan id
        await dbModel.deleteAdminMetodePembayaran(id);
        res.status(200).json({ message: 'Metode pembayaran berhasil dihapus' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data verifikasi pembayaran
const adminTampilVerifikasiPembayaran = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilVerifikasiPembayaran();
        if (data.length === 0) {
            return res.status(404).json({ message: 'Data verifikasi pembayaran tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data verifikasi pembayaran berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk mengupdate status verifikasi pembayaran
const adminUpdateVerifikasiPembayaran = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { status, catatan_admin } = req.body; // Mengambil status dari body request

        // Validasi Pastikan semua field diisi
        if (!status) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAdminVerifikasiPembayaran(id, status, catatan_admin);
        res.status(200).json({ message: 'Status verifikasi pembayaran berhasil diupdate' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// fungsi untuk menampilkan data faktur online admin
const adminTampilFakturOnline = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilFakturOnline();
        if (data.length === 0) {
            return res.status(404).json({ message: 'Data faktur online tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data faktur online berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data ulasan setiap produk
const adminTampilUlasanProduk = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const [data] = await dbModel.getAdminTampilUlasanProduk(id);
        if (data.length === 0) {
            return res.status(404).json({ message: 'Ulasan produk tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data ulasan produk berhasil diambil', data: data.map((item) => ({
            ...item,
            tanggal_komentar: timeMoment(item.tanggal).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
        })) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//fungsi untuk menampilkan data produk yang harus di restok oleh admin
const adminTampilProdukPerluRestok = async (req, res) => {
    try {
        const [data] = await dbModel.getAdminTampilProdukPerluRestok();
        if (data.length === 0) {
            return res.status(404).json({ message: 'Data produk tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Data produk berhasil diambil', data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const adminTampilPengiriman = async (req, res) => {
    try {
        const [rows] = await dbModel.getAdminTampilPengiriman();

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Data pengiriman tidak ditemukan' });
        }

        const grouped = {};

        rows.forEach(row => {
            const {
                id_pengiriman,
                alamat_pengiriman,
                status_pengiriman,
                tanggal_pengiriman,
                nama,
                warna,
                ukuran,
                jumlah_order
            } = row;

            if (!grouped[id_pengiriman]) {
                grouped[id_pengiriman] = {
                    id_pengiriman,
                    alamat_pengiriman,
                    status_pengiriman,
                    // Format tanggal menggunakan timeMoment
                    tanggal_pengiriman: timeMoment(tanggal_pengiriman).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
                    items: []
                };
            }

            grouped[id_pengiriman].items.push({
                nama,
                warna,
                ukuran,
                jumlah_order
            });
        });

        const result = Object.values(grouped);

        return res.status(200).json({ message: 'Data pengiriman berhasil diambil', data: result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

//fungsi untuk menampilkan data pengiriman detail
const adminTampilPengirimanDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await dbModel.getAdminTampilPengirimanDetail(id);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Data pengiriman tidak ditemukan' });
        }

        const {
            id_pengiriman,
            alamat_pengiriman,
            status_pengiriman,
            tanggal_pengiriman
        } = rows[0];

        const formattedData = {
            id_pengiriman,
            alamat_pengiriman,
            status_pengiriman,
            tanggal_pengiriman: timeMoment(tanggal_pengiriman).tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
            items: rows.map(item => ({
                nama: item.nama,
                warna: item.warna,
                ukuran: item.ukuran,
                jumlah_order: item.jumlah_order
            }))
        };

        return res.status(200).json({
            message: 'Detail pengiriman berhasil diambil',
            data: formattedData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

//fungsi untuk mengupdate status pengiriman
const adminUpdatePengiriman = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil id dari parameter URL
        const { status_pengiriman } = req.body; // Mengambil status dari body request

        // Validasi Pastikan semua field diisi
        if (!status_pengiriman) {
            return res.status(400).json({ message: 'Harap Mengisikan Data dengan Lengkap' });
        }

        // Simpan data ke database
        await dbModel.updateAdminStatusPengiriman(id, status_pengiriman);
        res.status(200).json({ message: 'Status pengiriman berhasil diupdate' });
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
    karyawanTambahProdukPenjualanOffline,
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
}