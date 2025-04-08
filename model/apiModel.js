const dbPool = require('../config/database');
const { post, get } = require('../routes/api');

const getPembeliUlasanProduk = (id) => {
    const SQLQuery = `SELECT produk.nama AS nama_produk, varian_produk.warna, varian_produk.ukuran, item_order.jumlah_order AS jumlah, item_order.harga FROM item_order JOIN orderan ON orderan.id = item_order.id_orderan JOIN varian_produk ON varian_produk.id = item_order.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk WHERE orderan.id = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const getPembeliRiwayatTransaksiDetail = (id) => {
    // Mengambil data riwayat transaksi pembeli berdasarkan id_orderan
    const SQLQuery = `SELECT produk.nama AS nama_produk, varian_produk.warna, varian_produk.ukuran, item_order.jumlah_order AS jumlah, item_order.harga FROM item_order JOIN orderan ON orderan.id = item_order.id_orderan JOIN varian_produk ON varian_produk.id = item_order.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk WHERE orderan.id = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const getPembeliRiwayatTransaksi = (id) => {
    // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
    const SQLQuery = `SELECT MIN(pembayaran.nama_pengirim) AS nama_pengirim, MIN(pembayaran.bank_pengirim) AS bank_pengirim, pembayaran.tanggal_transfer, MIN(orderan.status) AS status, MIN(orderan.catatan_admin) AS catatan_admin, MIN(orderan.id) AS id FROM pembayaran JOIN orderan ON pembayaran.id_orderan = orderan.id JOIN item_order ON item_order.id_orderan = orderan.id WHERE item_order.id_pengguna = ? GROUP BY pembayaran.tanggal_transfer`;
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
 }