const dbPool = require('../config/database');

const getUsernameLogin = (username) => {
    const SQLQuery = `SELECT * FROM pengguna WHERE username = ? LIMIT 1`;
    return dbPool.query(SQLQuery, [username])
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
    validasiDaftar
 }