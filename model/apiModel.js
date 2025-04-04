const dbPool = require('../config/database');
const { post } = require('../routes/api');

const postDataPembayaranPembeli= (id_order, nama_pengirim, bank_pengirim, bukti_transfer) => {
    const SQLQuery = `INSERT INTO pembayaran (id_order, nama_pengirim, bank_pengirim, bukti_transfer) VALUES (?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_order, nama_pengirim, bank_pengirim, bukti_transfer]);
}

const updateItemOrder = (id_order, id_pengguna) => {
    const SQLQuery = `UPDATE item_order SET id_order = ? WHERE id_pengguna = ? AND id_order IS NULL`;
    return dbPool.query(SQLQuery, [id_order, id_pengguna]);
}

const cekIdOrderKosong = (id_order, id_pengguna) => {
    const SQLQuery = `SELECT * FROM item_order WHERE id_pengguna = ? AND id_order IS NULL`;
    return dbPool.query(SQLQuery, [id_order, id_pengguna]);
}

const postPembeliOrderProduk = (id_metode_pembayaran, total_harga, ) => {
    const SQLQuery = `INSERT INTO order_produk (id_metode_pembayaran, total_harga, status) VALUES (?, ?, 'pending')`;
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
    postDataPembayaranPembeli
 }