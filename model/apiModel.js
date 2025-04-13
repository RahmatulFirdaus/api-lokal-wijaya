const dbPool = require('../config/database');
const { post, get } = require('../routes/api');

const postKaryawanTambahPengajuanIzin = (id_pengguna, tipe_izin, deskripsi, status, tanggal_mulai, tanggal_akhir) => {
    const SQLQuery = `INSERT INTO karyawan_pengajuan_izin (id_pengguna, tipe_izin, deskripsi, status, tanggal_mulai, tanggal_akhir) VALUES (?, ?, ?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_pengguna, tipe_izin, deskripsi, status, tanggal_mulai, tanggal_akhir]);
}

const getPengajuanIzinKaryawan = (id) => {
    const SQLQuery = `SELECT karyawan_pengajuan_izin.tipe_izin, karyawan_pengajuan_izin.deskripsi, karyawan_pengajuan_izin.status, karyawan_pengajuan_izin.tanggal_mulai, karyawan_pengajuan_izin.tanggal_akhir, pengguna.nama FROM karyawan_pengajuan_izin JOIN pengguna ON karyawan_pengajuan_izin.id_pengguna = pengguna.id WHERE pengguna.id = ?;`
    return dbPool.query(SQLQuery, [id]);
}
const getTampilUlasanProduk = (id) => {
    const SQLQuery = `SELECT * FROM komentar WHERE komentar.id_produk = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const getTampilProduk = () => {
    const SQLQuery = `SELECT produk.id AS id, produk.nama AS nama_produk, produk.deskripsi AS deskripsi_produk, produk.harga AS harga_produk, produk.link_gambar AS link_gambar_produk, SUM(varian_produk.stok) AS total_stok_produk FROM produk JOIN varian_produk ON produk.id = varian_produk.id_produk GROUP BY produk.id, produk.nama, produk.deskripsi, produk.harga, produk.link_gambar;
`;
    return dbPool.query(SQLQuery);
}

const getTampilProdukDetail = (id) => {
    const SQLQuery = `SELECT produk.id AS id, produk.nama AS nama_produk, produk.deskripsi AS deskripsi_produk, produk.harga AS harga_produk, produk.link_gambar AS link_gambar_produk, varian_produk.warna AS warna_produk, varian_produk.ukuran AS ukuran_produk, varian_produk.stok AS stok_produk FROM produk JOIN varian_produk ON produk.id = varian_produk.id_produk WHERE produk.id = ?`;
    return dbPool.query(SQLQuery, [id]);
}

const updateAkunPembeliNama = (id, nama) => {
    const SQLQuery = `UPDATE pengguna SET nama = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [nama, id]);
}

const updateAkunPembeliEmail = (id, email) => {
    const SQLQuery = `UPDATE pengguna SET email = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [email, id]);
}

const updateAkunPembeliNomorTelepon = (id, nomor_telp) => {
    const SQLQuery = `UPDATE pengguna SET nomor_telp = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [nomor_telp, id]);
}

const updateAkunPembeliPassword = (id, password) => {
    const SQLQuery = `UPDATE pengguna SET password = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [password, id]);
}   
const getPengiriman = (id_orderan) => {
    const SQLQuery = `SELECT * FROM pengiriman WHERE pengiriman.id_orderan = ?`;
    return dbPool.query(SQLQuery, [id_orderan]);
}

const getFakturPembeli = (id_orderan) => {
    const SQLQuery = `SELECT faktur.nomor_faktur, faktur.tanggal_faktur, orderan.id, pengguna.nama, item_order.harga, item_order.jumlah_order, produk.nama, varian_produk.warna, varian_produk.ukuran FROM faktur JOIN orderan ON faktur.id_orderan = orderan.id JOIN item_order ON item_order.id_orderan = orderan.id JOIN varian_produk ON item_order.id_varian_produk = varian_produk.id JOIN produk ON varian_produk.id_produk = produk.id JOIN pengguna ON item_order.id_pengguna = pengguna.id WHERE orderan.id = ?;
`;
    return dbPool.query(SQLQuery, [id_orderan]);
}

const postFakturPembeli = (id_orderan, nomor_faktur) => {
    const SQLQuery = `INSERT INTO faktur (nomor_faktur, id_orderan) VALUES (?, ?)`;
    return dbPool.query(SQLQuery, [nomor_faktur, id_orderan]);
}

const postPembeliTambahKomentar = (id_produk, id_pengguna, rating, komentar) => {
    const SQLQuery = `INSERT INTO komentar (id_produk, id_pengguna, rating, komentar) VALUES (?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_produk, id_pengguna, rating, komentar]);
}

const getPembeliUlasanProduk = (id) => {
    const SQLQuery = `SELECT produk.nama AS nama_produk, varian_produk.warna, varian_produk.ukuran, item_order.jumlah_order AS jumlah, item_order.harga, produk.id AS id_produk FROM item_order JOIN orderan ON orderan.id = item_order.id_orderan JOIN varian_produk ON varian_produk.id = item_order.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk WHERE orderan.id = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const getPembeliRiwayatTransaksiDetail = (id) => {
    // Mengambil data riwayat transaksi pembeli berdasarkan id_orderan
    const SQLQuery = `SELECT produk.nama AS nama_produk, varian_produk.warna, varian_produk.ukuran, item_order.jumlah_order AS jumlah, item_order.harga FROM item_order JOIN orderan ON orderan.id = item_order.id_orderan JOIN varian_produk ON varian_produk.id = item_order.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk WHERE orderan.id = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const getPembeliRiwayatTransaksi = (id) => {
    // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
    const SQLQuery = `SELECT MIN(pembayaran.nama_pengirim) AS nama_pengirim, MIN(pembayaran.bank_pengirim) AS bank_pengirim, pembayaran.tanggal_transfer, MIN(orderan.status) AS status, MIN(orderan.catatan_admin) AS catatan_admin, MIN(orderan.id) AS id_orderan FROM pembayaran JOIN orderan ON pembayaran.id_orderan = orderan.id JOIN item_order ON item_order.id_orderan = orderan.id WHERE item_order.id_pengguna = ? GROUP BY pembayaran.tanggal_transfer`;
    return dbPool.query(SQLQuery, [id]);
}

const postDataPembayaranPembeli= (id_orderan, nama_pengirim, bank_pengirim, bukti_transfer) => {
    const SQLQuery = `INSERT INTO pembayaran (id_orderan, nama_pengirim, bank_pengirim, bukti_transfer) VALUES (?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_orderan, nama_pengirim, bank_pengirim, bukti_transfer]);
}

const updateItemOrder = (id_orderan, id_pengguna) => {
    const SQLQuery = `UPDATE item_order SET id_orderan = ? WHERE id_pengguna = ? AND id_orderan IS NULL`;
    return dbPool.query(SQLQuery, [id_orderan, id_pengguna]);
}

const cekIdOrderKosong = (id_pengguna) => {
    const SQLQuery = `SELECT * FROM item_order WHERE id_pengguna = ? AND id_orderan IS NULL`;
    return dbPool.query(SQLQuery, [id_pengguna]);
}

const postPembeliOrderProduk = (id_metode_pembayaran, total_harga) => {
    const SQLQuery = `INSERT INTO orderan (id_metode_pembayaran, total_harga, status) VALUES (?, ?, 'pending')`;
    return dbPool.query(SQLQuery, [id_metode_pembayaran, total_harga]);
}

const postPembeliTambahKeranjang = (id_pengguna, id_varian_produk, jumlah_order, harga) => {
    const SQLQuery = `INSERT INTO item_order (id_pengguna, id_varian_produk, jumlah_order, harga) VALUES (?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_pengguna, id_varian_produk, jumlah_order, harga]);
}

const getUsernameLogin = (username) => {
    const SQLQuery = `SELECT * FROM pengguna WHERE username = ? LIMIT 1`;
    return dbPool.query(SQLQuery, [username]);
}

const postDaftar = (username, password, nama, email, nomor_telp) => {
    const SQLQuery = `INSERT INTO pengguna (username, password, nama, email, nomor_telp, role) VALUES (?, ?, ?, ?, ?, 'pembeli')`;
    return dbPool.query(SQLQuery, [username, password, nama, email, nomor_telp])
}

const validasiDaftar = (username, email) => {
    const SQLQuery = `SELECT * FROM pengguna WHERE username = ? OR email = ? LIMIT 1`;
    return dbPool.query(SQLQuery, [username, email]);
}


module.exports = { 
    getUsernameLogin,
    postDaftar,
    validasiDaftar, 
    postPembeliTambahKeranjang,
    cekIdOrderKosong,
    postPembeliOrderProduk,
    updateItemOrder, 
    postDataPembayaranPembeli, 
    getPembeliRiwayatTransaksi,
    getPembeliRiwayatTransaksiDetail,
    getPembeliUlasanProduk,
    postPembeliTambahKomentar,
    postFakturPembeli, 
    getFakturPembeli,
    getPengiriman,
    updateAkunPembeliNama,
    updateAkunPembeliEmail,
    updateAkunPembeliNomorTelepon,
    updateAkunPembeliPassword,
    getTampilProduk,
    getTampilProdukDetail,
    getTampilUlasanProduk,
    getPengajuanIzinKaryawan,
    postKaryawanTambahPengajuanIzin,
 }