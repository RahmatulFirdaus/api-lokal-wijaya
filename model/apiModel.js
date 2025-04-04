const dbPool = require('../config/database');
const { post } = require('../routes/api');

//Fungsi untuk mencari id_order yang kosong di item_order
const cekIdOrderKosong = (id_order) => {
    const SQLQuery = `SELECT * FROM item_order WHERE id_order IS NULL`;
    return dbPool.query(SQLQuery, [id_order]);
}

const pembeliOrderProduk = (id_pengguna, id_varian_produk, jumlah_order, harga) => {
    const SQLQuery = `INSERT INTO item_order (id_pengguna, id_varian_produk, jumlah_order, harga) VALUES (?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_pengguna, id_varian_produk, jumlah_order, harga]);
}

const postPembeliTambahKeranjang = (id_pengguna, id_varian_produk, jumlah_order, harga) => {
    const SQLQuery = `INSERT INTO item_order (id_pengguna, id_varian_produk, jumlah_order, harga) VALUES (?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_pengguna, id_varian_produk, jumlah_order, harga]);
}

const getUsernameLogin = (username) => {
    const SQLQuery = `SELECT * FROM pengguna WHERE username = ? LIMIT 1`;
    return dbPool.query(SQLQuery, [username]);
}

const postDaftar = (username, password, nama, email, nomor_telp, role) => {
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
    cekIdOrderKosong
 }