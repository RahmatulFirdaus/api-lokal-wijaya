const dbPool = require('../config/database');
const { post, get } = require('../routes/api');

const tampilSemuaProduk = () => {
    const SQLQuery = `SELECT p.nama AS nama_produk, p.deskripsi, p.harga, v.ukuran, v.warna, v.stok FROM produk p JOIN varian_produk v ON p.id = v.id_produk;`;
    return dbPool.query(SQLQuery);
};

const getIdOrderanDikirim = () => {
    const SQLQuery = `select orderan.id, pengiriman.status_pengiriman from orderan join pengiriman ON pengiriman.id_orderan = orderan.id where pengiriman.status_pengiriman = "dikirim"`;
    return dbPool.query(SQLQuery);
};

const updateLocation = (id_orderan, lat, lng) => {
    const SQLQuery = `INSERT INTO lokasi_pengiriman (id_orderan, lat, lng)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE lat = ?, lng = ?, updated_at = NOW()`;
    return dbPool.query(SQLQuery, [id_orderan, lat, lng, lat, lng]);
};

const getLocation = (id_orderan) => {
    const SQLQuery = `SELECT lat, lng FROM lokasi_pengiriman WHERE id_orderan = ?`;
    return dbPool.query(SQLQuery, [id_orderan]);
};

const postIDOrderanLokasiPengiriman = (id_orderan) => {
    const SQLQuery = `INSERT INTO lokasi_pengiriman (id_orderan) VALUES (?)`;
    return dbPool.query(SQLQuery, [id_orderan]);
};

const getPenggunaPembeli = () => {
    const SQLQuery = `SELECT pengguna.id, pengguna.nama FROM pengguna where pengguna.role = "pembeli"`;
    return dbPool.query(SQLQuery);
};

const updateProdukDenganVideo = (id, nama_produk, deskripsi_produk, harga_produk, video_demo) => {
    const SQLQuery = `UPDATE produk SET nama = ?, deskripsi = ?, harga = ?, video_demo = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [nama_produk, deskripsi_produk, harga_produk, video_demo, id]);
};

const updateProdukDenganGambarDanVideo = (id, nama_produk, deskripsi_produk, harga_produk, link_gambar, video_demo) => {
    const SQLQuery = `UPDATE produk SET nama = ?, deskripsi = ?, harga = ?, link_gambar = ?, video_demo = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [nama_produk, deskripsi_produk, harga_produk, link_gambar, video_demo, id]);
};


const tampilDataPenggunaKaryawan = () => {
    const SQLQuery = `SELECT pengguna.id, pengguna.nama 
FROM pengguna 
LEFT JOIN gaji_karyawan ON pengguna.id = gaji_karyawan.id_pengguna 
WHERE pengguna.role = 'karyawan' AND gaji_karyawan.id_pengguna IS NULL;`;
    return dbPool.query(SQLQuery);
}

const ubahStatusGajiKaryawan = (id_pengguna) => {
    const SQLQuery = `update gaji_karyawan set status = 'belum' where id_pengguna = ?`;
    return dbPool.query(SQLQuery, [id_pengguna]);
}

const deleteGajiKaryawan = (id_pengguna) => {
    const SQLQuery = `delete from gaji_karyawan where id_pengguna = ?`;
    return dbPool.query(SQLQuery, [id_pengguna]);
}

const updateGajiKaryawan = (id_pengguna, gaji) => {
    const SQLQuery = `update gaji_karyawan set gaji = ? where id_pengguna = ?`;
    return dbPool.query(SQLQuery, [gaji, id_pengguna]);
}

const postGajiKaryawan = (id_pengguna, gaji) => {
    const SQLQuery = `insert into gaji_karyawan (id_pengguna, gaji) values (?, ?)`;
    return dbPool.query(SQLQuery, [id_pengguna, gaji]);
}

const getGajiKaryawan = () => {
    const SQLQuery = `select pengguna.id, pengguna.nama, gaji_karyawan.gaji from pengguna join gaji_karyawan on gaji_karyawan.id_pengguna = pengguna.id`;
    return dbPool.query(SQLQuery);
}

const updateProdukTanpaGambar = async (id, nama, deskripsi, harga) => {
  const query = `
    UPDATE produk 
    SET nama = ?, deskripsi = ?, harga = ?
    WHERE id = ?`; // KOMA SEBELUM 'WHERE' DIHAPUS
  return dbPool.query(query, [nama, deskripsi, harga, id]);
};

const updateVarianProdukTanpaGambar = async (id_varian, warna, ukuran, stok) => {
  const query = `
    UPDATE varian_produk 
    SET warna = ?, ukuran = ?, stok = ?
    WHERE id = ?`; // KOMA SEBELUM 'WHERE' DIHAPUS
  return dbPool.query(query, [warna, ukuran, stok, id_varian]);
};


const deleteKaryawanPenjualanOffline = (id) => {
    const SQLQuery = `DELETE FROM karyawan_penjualan_offline WHERE id = ?`;
    return dbPool.query(SQLQuery, [id]);
}

const deleteKaryawanPengajuanIzin = (id) => {
    const SQLQuery = `DELETE FROM karyawan_pengajuan_izin WHERE id = ?`;
    return dbPool.query(SQLQuery, [id]);
}

const getPembeliKomentar = (id_pengguna, id_produk,) => {    
    const SQLQuery = `SELECT * FROM komentar WHERE id_pengguna = ? AND id_varian_produk= ?;`;
    return dbPool.query(SQLQuery, [id_pengguna, id_produk]);
}   

const cekStatusPengiriman = (id_orderan) => {
    const SQLQuery = `select pengiriman.status_pengiriman AS status from pengiriman where pengiriman.id_orderan = ?`;
    return dbPool.query(SQLQuery, [id_orderan]);
}

const cekStatusOrderan = (id_orderan) => {
    const SQLQuery = `select orderan.status AS status from orderan where orderan.id = ?`;
    return dbPool.query(SQLQuery, [id_orderan]);
}

const getProfilePembeli = (id) => {
    const SQLQuery = `select * from pengguna where role = "pembeli" AND pengguna.id = ?`;
    return dbPool.query(SQLQuery, [id]);
}

const getChatListPembeli = (id) => {
    const SQLQuery = `SELECT DISTINCT pengguna.* FROM pengguna JOIN chats ON pengguna.id = chats.id_pengirim WHERE pengguna.role = 'pembeli' AND chats.pesan IS NOT NULL AND chats.pesan <> '' AND chats.id_penerima = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const getChatListAdmin = () => {
    const SQLQuery = `SELECT * FROM pengguna WHERE role = 'admin'`;
    return dbPool.query(SQLQuery);
}

const postChat = ( pesan, id_pengirim, id_penerima, ) => {
    const SQLQuery = `INSERT INTO chats ( pesan, id_pengirim, id_penerima) VALUES ( ?, ?, ?)`;
    return dbPool.query(SQLQuery, [pesan, id_pengirim, id_penerima, ]);
}

const getChat = (id_user_login, id_user_lawan) => {
    const SQLQuery = `
      SELECT * FROM chats 
      WHERE 
        (id_pengirim = ? AND id_penerima = ?) OR 
        (id_pengirim = ? AND id_penerima = ?)
      ORDER BY created_at ASC
    `;
    return dbPool.query(SQLQuery, [
      id_user_login, id_user_lawan,
      id_user_lawan, id_user_login
    ]);
}
const postHargaModal = (id_produk, harga_asli) => {
    const SQLQuery = `INSERT INTO produk_eco (id_produk, harga_asli, status) VALUES (?, ?, 'sudah')`;
    return dbPool.query(SQLQuery, [id_produk, harga_asli]);
}

const updateHargaAsli = (id_produk, harga_awal) => {
    const SQLQuery = `UPDATE produk_sebelum_diskon SET harga_awal = ? WHERE id_produk = ?`;
    return dbPool.query(SQLQuery, [harga_awal, id_produk]);
}

const postHargaAsli = (id_produk, harga_awal) => {
    const SQLQuery = `INSERT INTO produk_sebelum_diskon (id_produk, harga_awal) VALUES (?, ?)`;
    return dbPool.query(SQLQuery, [id_produk, harga_awal]);
}

const deleteAdminDataAkun = (id) => {
    const SQLQuery = `DELETE FROM pengguna WHERE id = ?`;
    return dbPool.query(SQLQuery, [id]);
}

const getAdminCekDataAkun = (username, email) => {
    const SQLQuery = `SELECT * FROM pengguna WHERE username = ? OR email = ? LIMIT 1`;
    return dbPool.query(SQLQuery, [username, email]);
}

const postAdminDataAkun = (username, password, nama_lengkap, email, nomor_telp, role) => {
    const SQLQuery = `INSERT INTO pengguna (username, password, nama, email, nomor_telp, role, status) VALUES (?, ?, ?, ?, ?, ?, 'diterima')`;
    return dbPool.query(SQLQuery, [username, password, nama_lengkap, email, nomor_telp, role]);
}

const updateAdminDataAkun = (id, username, password, nama, email, nomor_telp, role) => {
    const SQLQuery = `UPDATE pengguna SET username = ?, password = ?, nama = ?, email = ?, nomor_telp = ?, role = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [username, password, nama, email, nomor_telp, role, id]);
}

const getAdminTampilDataAkun = () => {
    const SQLQuery = `SELECT * FROM pengguna`;
    return dbPool.query(SQLQuery);
}

const updateAdminStatusPengiriman = (id, status) => {   
    const SQLQuery = `UPDATE pengiriman SET status_pengiriman = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [status, id]);
}

const getAdminTampilPengirimanDetail = (id) => {
    const SQLQuery = `SELECT pengiriman.id AS id_pengiriman, produk.harga as harga_satuan, orderan.total_harga, pengguna.nama as nama_pengguna, pengiriman.alamat_pengiriman, pengiriman.status_pengiriman, pengiriman.tanggal_pengiriman, produk.nama, varian_produk.warna, varian_produk.ukuran, item_order.jumlah_order FROM pengiriman JOIN orderan ON pengiriman.id_orderan = orderan.id JOIN item_order ON item_order.id_orderan = pengiriman.id_orderan JOIN pengguna ON pengguna.id = item_order.id_pengguna JOIN varian_produk ON varian_produk.id = item_order.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk WHERE pengiriman.id = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const getAdminTampilPengiriman = () => {
    const SQLQuery = `SELECT pengiriman.id AS id_pengiriman, produk.harga as harga_satuan, orderan.total_harga, pengguna.nama as nama_pengguna, pengiriman.alamat_pengiriman, pengiriman.status_pengiriman, pengiriman.tanggal_pengiriman, produk.nama, varian_produk.warna, varian_produk.ukuran, item_order.jumlah_order FROM pengiriman JOIN orderan ON pengiriman.id_orderan = orderan.id JOIN item_order ON item_order.id_orderan = pengiriman.id_orderan JOIN pengguna ON pengguna.id = item_order.id_pengguna JOIN varian_produk ON varian_produk.id = item_order.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk;`;
    return dbPool.query(SQLQuery);
}

const postPengiriman = (id_orderan, alamat_pengiriman) => {
    const SQLQuery = `INSERT INTO pengiriman (id_orderan, alamat_pengiriman, status_pengiriman) VALUES (?, ?, 'diproses')`;
    return dbPool.query(SQLQuery, [id_orderan, alamat_pengiriman]);
}

const getItemOrderById = (id) => {
    const SQLQuery = `SELECT id_varian_produk, jumlah_order FROM item_order WHERE id = ?`;
    return dbPool.query(SQLQuery, [id]);
};

const getPenjualanOfflineById = (id) => {
    const SQLQuery = `SELECT id_varian_produk, jumlah FROM karyawan_penjualan_offline WHERE id = ?`;
    return dbPool.query(SQLQuery, [id]);
};

const kembalikanStokVarianProduk = (id_varian_produk, jumlah_order) => {
    const SQLQuery = `UPDATE varian_produk SET stok = stok + ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [jumlah_order, id_varian_produk]);
};


const getStokVarianProduk = (id_varian_produk) => {
    const SQLQuery = `SELECT stok FROM varian_produk WHERE id = ?`;
    return dbPool.query(SQLQuery, [id_varian_produk]);
};


const updateStokVarianProduk = (id_varian_produk, jumlah_order) => {
    const SQLQuery = `UPDATE varian_produk SET stok = stok - ? WHERE id = ?`; //diisi dengan id varian_produk
    return dbPool.query(SQLQuery, [jumlah_order, id_varian_produk]);
};

const getAdminTampilProdukPerluRestok = () => {
    const SQLQuery = `SELECT produk.nama AS nama_produk, varian_produk.link_gambar_varian, varian_produk.warna, varian_produk.ukuran, varian_produk.stok FROM varian_produk INNER JOIN produk ON varian_produk.id_produk = produk.id WHERE varian_produk.stok < 1 ORDER BY produk.nama ASC;`;
    return dbPool.query(SQLQuery);
}

const getAdminTampilUlasanProduk = (id) => {
    const SQLQuery = `SELECT komentar.rating, komentar.komentar, komentar.tanggal_komentar, pengguna.nama from komentar join pengguna on pengguna.id = komentar.id_pengguna where komentar.id_produk = ?`;
    return dbPool.query(SQLQuery , [id]);
}

const getAdminTampilFakturOnline = () => {
    const SQLQuery = `SELECT faktur.nomor_faktur, faktur.tanggal_faktur, orderan.id, pengguna.nama as nama_pengguna, produk.harga, item_order.jumlah_order, produk.nama as nama_barang, varian_produk.warna, varian_produk.ukuran, pengiriman.alamat_pengiriman FROM faktur JOIN orderan ON faktur.id_orderan = orderan.id JOIN item_order ON item_order.id_orderan = orderan.id JOIN varian_produk ON item_order.id_varian_produk = varian_produk.id JOIN produk ON varian_produk.id_produk = produk.id JOIN pengguna ON item_order.id_pengguna = pengguna.id JOIN pengiriman ON orderan.id = pengiriman.id_orderan;`;
    return dbPool.query(SQLQuery);
}

const updateAdminVerifikasiPembayaran = (id, status, catatan_admin) => {
    const SQLQuery = `UPDATE orderan SET status = ?, catatan_admin = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [status, catatan_admin, id]);
}

const getAdminTampilVerifikasiPembayaran = () => {
    const SQLQuery = `SELECT orderan.id as id_orderan, orderan.status, orderan.catatan_admin, pembayaran.nama_pengirim, pembayaran.bank_pengirim, pembayaran.tanggal_transfer, bukti_transfer.bukti_transfer FROM orderan JOIN pembayaran ON pembayaran.id_orderan = orderan.id JOIN bukti_transfer ON bukti_transfer.id_pembayaran= pembayaran.id`;
    return dbPool.query(SQLQuery);
}

const deleteAdminMetodePembayaran = (id) => {
    const SQLQuery = `DELETE FROM metode_pembayaran WHERE id = ?`;
    return dbPool.query(SQLQuery, [id]);
}

const updateAdminMetodePembayaran = (id, nama_metode, deskripsi) => {
    const SQLQuery = `UPDATE metode_pembayaran SET nama_metode = ?, deskripsi = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [nama_metode, deskripsi, id]);
}

const postAdminMetodePembayaran = (nama_metode, deskripsi) => {
    const SQLQuery = `INSERT INTO metode_pembayaran (nama_metode, deskripsi ) VALUES (?, ?)`;
    return dbPool.query(SQLQuery, [nama_metode, deskripsi]);
}

const deletePembeliKeranjang = (id) => {
    const SQLQuery = `DELETE FROM item_order WHERE id = ?`;
    return dbPool.query(SQLQuery, [id]);
}

const getPembeliTampilKeranjang = (id) => {
    const SQLQuery = `SELECT item_order.id AS id_item_order,varian_produk.id as id_varian_produk, varian_produk.link_gambar_varian, produk_sebelum_diskon.harga_awal, produk.nama AS nama_produk, varian_produk.warna, varian_produk.ukuran, item_order.jumlah_order AS jumlah, produk.harga AS harga_satuan FROM item_order JOIN varian_produk ON item_order.id_varian_produk = varian_produk.id JOIN produk ON varian_produk.id_produk = produk.id JOIN produk_sebelum_diskon ON produk_sebelum_diskon.id_produk = produk.id WHERE item_order.id_pengguna = ? AND item_order.id_orderan IS NULL;`;
    return dbPool.query(SQLQuery, [id]);
}

const getAdminMetodePembayaran = () => {
    const SQLQuery = `SELECT * FROM metode_pembayaran`;
    return dbPool.query(SQLQuery);
}

const getAdminHargaAsli = () => {
    const SQLQuery = `SELECT SUM(harga_asli) AS total_harga_asli FROM produk_eco;`;
    return dbPool.query(SQLQuery);
}

const getAdminLaporanTotalHargaOnline = () => {
    const SQLQuery = `SELECT DATE(orderan.tanggal_order) AS tanggal, SUM(produk.harga * item_order.jumlah_order) AS total_harga, SUM(CASE WHEN produk_eco.status = 'sudah' THEN produk_eco.harga_asli * item_order.jumlah_order ELSE 0 END) AS total_harga_asli, SUM(CASE WHEN produk_eco.status = 'sudah' THEN (produk.harga - produk_eco.harga_asli) * item_order.jumlah_order ELSE 0 END) AS total_keuntungan FROM orderan JOIN item_order ON item_order.id_orderan = orderan.id JOIN varian_produk ON item_order.id_varian_produk = varian_produk.id JOIN produk ON varian_produk.id_produk = produk.id LEFT JOIN produk_eco ON produk_eco.id_produk = produk.id GROUP BY DATE(orderan.tanggal_order) ORDER BY tanggal ASC;
`;
    return dbPool.query(SQLQuery);
}

const getAdminLaporanTotalHargaOffline = () => {
    const SQLQuery = `SELECT DATE(karyawan_penjualan_offline.tanggal) AS tanggal, SUM(CASE WHEN produk_eco.status = 'sudah' THEN produk.harga ELSE produk.harga END) AS total_penjualan, SUM(CASE WHEN produk_eco.status = 'sudah' THEN produk_eco.harga_asli ELSE 0 END) AS total_harga_asli, SUM(CASE WHEN produk_eco.status = 'sudah' THEN (produk.harga - produk_eco.harga_asli) ELSE 0 END) AS total_keuntungan FROM karyawan_penjualan_offline JOIN varian_produk ON karyawan_penjualan_offline.id_varian_produk = varian_produk.id JOIN produk ON varian_produk.id_produk = produk.id LEFT JOIN produk_eco ON produk_eco.id_produk = produk.id GROUP BY DATE(karyawan_penjualan_offline.tanggal) ORDER BY tanggal ASC;`;
    return dbPool.query(SQLQuery);
}

// Fungsi baru untuk mengambil data gaji karyawan
const getGajiKaryawanInfo = () => {
    const SQLQuery = `SELECT gaji FROM gaji_karyawan;`;
    return dbPool.query(SQLQuery);
}

const getAdminTampilPenjualanHarianOffline = () => {
    const SQLQuery = `SELECT karyawan_penjualan_offline.tanggal, produk.nama AS nama_produk, produk.harga, varian_produk.warna, varian_produk.ukuran, varian_produk.link_gambar_varian FROM karyawan_penjualan_offline JOIN pengguna ON pengguna.id = karyawan_penjualan_offline.id_pengguna JOIN varian_produk ON varian_produk.id = karyawan_penjualan_offline.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk ORDER BY karyawan_penjualan_offline.tanggal DESC;`;
    return dbPool.query(SQLQuery);
}

const getAdminTampilPenjualanHarianOnline = () => {
    const SQLQuery = `SELECT orderan.id as id_orderan, item_order.jumlah_order, pengguna.nama AS nama_pengguna, orderan.tanggal_order, orderan.total_harga, produk.nama AS nama_produk, varian_produk.warna, varian_produk.ukuran, produk.harga AS harga_satuan, varian_produk.link_gambar_varian FROM item_order JOIN orderan ON orderan.id = item_order.id_orderan JOIN pengguna ON pengguna.id = item_order.id_pengguna JOIN varian_produk ON varian_produk.id = item_order.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk ORDER BY orderan.tanggal_order DESC;`;
    return dbPool.query(SQLQuery);
}

const updateAdminUbahProdukEco = (id_produk, harga_asli) => {
    const SQLQuery = `UPDATE produk_eco SET harga_asli = ?, status = 'sudah' WHERE id_produk = ?`;
    return dbPool.query(SQLQuery, [harga_asli, id_produk]);
}

const postAdminTambahProdukEco = (id_produk, status, harga_asli) => {
    const SQLQuery = `INSERT INTO produk_eco (id_produk, status, harga_asli) VALUES (?, 'sudah', ?) `;
    return dbPool.query(SQLQuery, [id_produk, status, harga_asli]);
}

const getAdminTampilProdukEco = () => {
    const SQLQuery = `select produk.id,produk.nama, produk_eco.status, produk_eco.harga_asli from produk left join produk_eco on produk_eco.id_produk = produk.id`;
    return dbPool.query(SQLQuery);
}

const getAdminTampilHasilTransaksiOnline = () => {
    const SQLQuery = `SELECT orderan.id as id_orderan, item_order.jumlah_order, pengguna.nama AS nama_pengguna, orderan.status, orderan.tanggal_order, orderan.total_harga, produk.nama AS nama_produk, produk.harga AS harga_satuan, varian_produk.warna, varian_produk.ukuran FROM item_order JOIN orderan ON orderan.id = item_order.id_orderan JOIN pengguna ON pengguna.id = item_order.id_pengguna JOIN varian_produk ON varian_produk.id = item_order.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk;`;
    return dbPool.query(SQLQuery);
}

const deleteAdminVarianProduk = (id) => {
    const SQLQuery = `DELETE FROM varian_produk WHERE id = ?`;
    return dbPool.query(SQLQuery, [id]);
}

const deleteAdminProduk = (id) => {
    const SQLQuery = `DELETE FROM produk WHERE id = ?`;
    return dbPool.query(SQLQuery, [id]);
}

const getAdminProduk = (id) => {
    const SQLQuery = `
        SELECT 
            p.id, p.nama, p.deskripsi, p.harga, p.link_gambar, p.kategori, p.video_demo,
            psd.harga_awal
        FROM produk p
        LEFT JOIN produk_sebelum_diskon psd ON p.id = psd.id_produk
        WHERE p.id = ?;
    `;
    return dbPool.query(SQLQuery, [id]);
}


const getAdminVarianProduk = (id) => {
    const SQLQuery = `SELECT id, id_produk, warna, ukuran, stok, link_gambar_varian FROM varian_produk WHERE id_produk = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const updateVarianProduk = (id_varian, warna, ukuran, stok, link_gambar) => {
    const SQLQuery = `UPDATE varian_produk SET warna = ?, ukuran = ?, stok = ?, link_gambar_varian = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [warna, ukuran, stok, link_gambar, id_varian]);
};

const updateProduk = (id, nama_produk, deskripsi_produk, harga_produk, link_gambar) => {
    const SQLQuery = `UPDATE produk SET nama = ?, deskripsi = ?, harga = ?, link_gambar = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [nama_produk, deskripsi_produk, harga_produk, link_gambar, id]);
};

const insertVarianBaru = (id_produk, warna, ukuran, stok, link_gambar) => {
    const SQLQuery = `INSERT INTO varian_produk (id_produk, warna, ukuran, stok, link_gambar_varian) VALUES (?, ?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_produk, warna, ukuran, stok, link_gambar]);
};


const postAdminTambahVarianProduk = (id_produk, warna, ukuran, stok, gambar) => {
    const SQLQuery = `
        INSERT INTO varian_produk (id_produk, warna, ukuran, stok, link_gambar_varian)
        VALUES (?, ?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_produk, warna, ukuran, stok, gambar]);
};


const postAdminTambahProduk = (nama_produk, deskripsi, harga_produk, link_gambar, kategori, video_demo = null) => {
    const SQLQuery = `INSERT INTO produk (nama, deskripsi, harga, link_gambar, kategori, video_demo) VALUES (?, ?, ?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [nama_produk, deskripsi, harga_produk, link_gambar, kategori, video_demo]);
}
const updateAdminStatusPengajuanIzinKaryawan = (id, status) => {
    const SQLQuery = `UPDATE karyawan_pengajuan_izin SET status = ? WHERE id = ?`;
    return dbPool.query(SQLQuery, [status, id]);
}

const getAdminTampilPengajuanIzinKaryawanDetail = (id) => {
    const SQLQuery = `SELECT pengguna.nama, karyawan_pengajuan_izin.tipe_izin, karyawan_pengajuan_izin.deskripsi, karyawan_pengajuan_izin.status, karyawan_pengajuan_izin.tanggal_mulai, karyawan_pengajuan_izin.tanggal_akhir FROM pengguna JOIN karyawan_pengajuan_izin ON pengguna.id = karyawan_pengajuan_izin.id_pengguna WHERE karyawan_pengajuan_izin.id = ?`;
    return dbPool.query(SQLQuery, [id]);
}

const getAdminTampilPengajuanIzinKaryawan = () => {
    const SQLQuery = `SELECT karyawan_pengajuan_izin.id, pengguna.nama, karyawan_pengajuan_izin.tipe_izin, karyawan_pengajuan_izin.deskripsi, karyawan_pengajuan_izin.status, karyawan_pengajuan_izin.tanggal_mulai, karyawan_pengajuan_izin.tanggal_akhir FROM pengguna JOIN karyawan_pengajuan_izin ON pengguna.id = karyawan_pengajuan_izin.id_pengguna`;
    return dbPool.query(SQLQuery);
}

const getAdminTampilAbsensiKaryawan = () => {
    const SQLQuery = `SELECT pengguna.nama, karyawan_absensi.tanggal, karyawan_absensi.absen_masuk FROM pengguna JOIN karyawan_absensi ON pengguna.id = karyawan_absensi.id_pengguna`;
    return dbPool.query(SQLQuery);
}

const postKaryawanTambahPenjualanOffline = (id_varian_produk, id_pengguna, jumlah) => {
    const SQLQuery = `INSERT INTO karyawan_penjualan_offline (id_varian_produk, id_pengguna, jumlah) VALUES (?, ?, ?) `;
    return dbPool.query(SQLQuery, [id_varian_produk, id_pengguna, jumlah]);
}

const getKaryawanPenjualanOffline = () => {
    const SQLQuery = `SELECT karyawan_penjualan_offline.id, produk.nama AS nama_produk, produk.harga, varian_produk.warna, varian_produk.ukuran, pengguna.nama, karyawan_penjualan_offline.tanggal, karyawan_penjualan_offline.jumlah, varian_produk.link_gambar_varian from produk join varian_produk on varian_produk.id_produk = produk.id join karyawan_penjualan_offline on karyawan_penjualan_offline.id_varian_produk = varian_produk.id join pengguna on karyawan_penjualan_offline.id_pengguna = pengguna.id`;
    return dbPool.query(SQLQuery);
}

const cekAbensiKaryawan = (id_pengguna) => {
    const SQLQuery = `SELECT * FROM karyawan_absensi WHERE id_pengguna = ? AND DATE(tanggal) = CURDATE()`;
    return dbPool.query(SQLQuery, [id_pengguna]);
}

const postKaryawanTambahAbsensi = (id_pengguna) => {
    const SQLQuery = `INSERT INTO karyawan_absensi (id_pengguna, absen_masuk) VALUES (?, 'hadir')`;
    return dbPool.query(SQLQuery, [id_pengguna]);
}

const postKaryawanTambahPengajuanIzin = (id_pengguna, tipe_izin, deskripsi, tanggal_mulai, tanggal_akhir) => {
    const SQLQuery = `INSERT INTO karyawan_pengajuan_izin (id_pengguna, tipe_izin, deskripsi, status, tanggal_mulai, tanggal_akhir) VALUES (?, ?, ?, 'pending', ?, ?)`;
    return dbPool.query(SQLQuery, [id_pengguna, tipe_izin, deskripsi, tanggal_mulai, tanggal_akhir]);
}

const getPengajuanIzinKaryawan = (id) => {
    const SQLQuery = `SELECT karyawan_pengajuan_izin.id, karyawan_pengajuan_izin.tipe_izin, karyawan_pengajuan_izin.deskripsi, karyawan_pengajuan_izin.status, karyawan_pengajuan_izin.tanggal_mulai, karyawan_pengajuan_izin.tanggal_akhir, pengguna.nama FROM karyawan_pengajuan_izin JOIN pengguna ON karyawan_pengajuan_izin.id_pengguna = pengguna.id WHERE pengguna.id = ?;`
    return dbPool.query(SQLQuery, [id]);
}
const getTampilUlasanProduk = (id) => {
    const SQLQuery = `SELECT komentar.id, pengguna.nama, komentar.id_produk, komentar.rating, komentar.komentar, komentar.tanggal_komentar FROM komentar JOIN pengguna ON komentar.id_pengguna = pengguna.id WHERE komentar.id_produk = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const getTampilProduk = () => {
    const SQLQuery = `SELECT produk.id AS id, produk.kategori, produk_sebelum_diskon.harga_awal, produk.nama AS nama_produk, produk.deskripsi AS deskripsi_produk, produk.harga AS harga_produk, produk.link_gambar AS link_gambar_produk, SUM(varian_produk.stok) AS total_stok_produk, AVG(komentar.rating) AS rating FROM produk JOIN varian_produk ON produk.id = varian_produk.id_produk JOIN produk_sebelum_diskon ON produk_sebelum_diskon.id_produk = produk.id LEFT JOIN komentar ON komentar.id_produk = produk.id GROUP BY produk.id, produk.kategori, produk_sebelum_diskon.harga_awal, produk.nama, produk.deskripsi, produk.harga, produk.link_gambar;
`;
    return dbPool.query(SQLQuery);
}

const getTampilProdukDetail = (id) => {
    const SQLQuery = `SELECT produk.id AS id, produk.nama AS nama_produk, produk_sebelum_diskon.harga_awal, produk.deskripsi AS deskripsi_produk, produk.harga AS harga_produk, produk.link_gambar AS link_gambar_produk, produk.kategori AS kategori_produk, produk.video_demo, produk.created_at, varian_produk.id AS id_varian, varian_produk.warna AS warna_produk, varian_produk.ukuran AS ukuran_produk, varian_produk.stok AS stok_produk, varian_produk.link_gambar_varian FROM produk JOIN varian_produk ON produk.id = varian_produk.id_produk JOIN produk_sebelum_diskon ON produk_sebelum_diskon.id_produk = produk.id WHERE produk.id = ?`;
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

const getFakturPembeli = (id) => {
    const SQLQuery = `SELECT faktur.nomor_faktur, faktur.tanggal_faktur, orderan.id, pengguna.nama as nama_pengguna, pengiriman.alamat_pengiriman, produk.harga, item_order.jumlah_order, produk.nama as nama_barang, varian_produk.warna, varian_produk.ukuran FROM faktur JOIN orderan ON faktur.id_orderan = orderan.id JOIN item_order ON item_order.id_orderan = orderan.id JOIN varian_produk ON item_order.id_varian_produk = varian_produk.id JOIN produk ON varian_produk.id_produk = produk.id JOIN pengguna ON item_order.id_pengguna = pengguna.id JOIN pengiriman ON pengiriman.id_orderan = orderan.id WHERE orderan.id = ?;
`;
    return dbPool.query(SQLQuery, [id]);
}

const postFakturPembeli = (id_orderan, nomor_faktur) => {
    const SQLQuery = `INSERT INTO faktur (nomor_faktur, id_orderan) VALUES (?, ?)`;
    return dbPool.query(SQLQuery, [nomor_faktur, id_orderan]);
}

const postPembeliTambahKomentar = (id_produk, id_pengguna, id_varian_produk, rating, komentar) => {
    const SQLQuery = `INSERT INTO komentar (id_produk, id_pengguna, id_varian_produk, rating, komentar) VALUES (?, ?, ?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_produk, id_pengguna, id_varian_produk, rating, komentar]);
}

const getPembeliUlasanProduk = (id) => {
    const SQLQuery = `SELECT produk.nama AS nama_produk, varian_produk.warna, varian_produk.ukuran, item_order.jumlah_order AS jumlah, produk.harga, produk.id AS id_produk FROM item_order JOIN orderan ON orderan.id = item_order.id_orderan JOIN varian_produk ON varian_produk.id = item_order.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk WHERE orderan.id = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const getPembeliRiwayatTransaksiDetail = (id) => {
    // Mengambil data riwayat transaksi pembeli berdasarkan id_orderan
    const SQLQuery = `SELECT produk.id AS id_produk, varian_produk.id AS id_varian_produk, produk.nama AS nama_produk, varian_produk.warna, varian_produk.ukuran, item_order.jumlah_order AS jumlah, produk.harga, varian_produk.link_gambar_varian FROM item_order JOIN orderan ON orderan.id = item_order.id_orderan JOIN varian_produk ON varian_produk.id = item_order.id_varian_produk JOIN produk ON produk.id = varian_produk.id_produk WHERE orderan.id = ?;`;
    return dbPool.query(SQLQuery, [id]);
}

const getPembeliRiwayatTransaksi = (id) => {
    // Mengambil data riwayat transaksi pembeli berdasarkan id_pengguna
    const SQLQuery = `SELECT MIN(pembayaran.nama_pengirim) AS nama_pengirim, MIN(pembayaran.bank_pengirim) AS bank_pengirim, pembayaran.tanggal_transfer, MIN(orderan.status) AS status, MIN(orderan.catatan_admin) AS catatan_admin, MIN(orderan.id) AS id_orderan, orderan.id AS id_orderan FROM pembayaran JOIN orderan ON pembayaran.id_orderan = orderan.id JOIN item_order ON item_order.id_orderan = orderan.id WHERE item_order.id_pengguna = ? GROUP BY pembayaran.tanggal_transfer, orderan.id ORDER BY CASE WHEN MIN(orderan.status) = 'pending' THEN 0 ELSE 1 END, pembayaran.tanggal_transfer DESC;`;
    return dbPool.query(SQLQuery, [id]);
}

const postDataPembayaranPembeli= (id_orderan, nama_pengirim, bank_pengirim) => {
    const SQLQuery = `INSERT INTO pembayaran (id_orderan, nama_pengirim, bank_pengirim) VALUES (?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_orderan, nama_pengirim, bank_pengirim]);
}

const postDataBuktiTransferPembeli = (id_pembayaran, link_bukti_transfer) => {
    const SQLQuery = `INSERT INTO bukti_transfer (id_pembayaran, bukti_transfer) VALUES (?, ?)`;
    return dbPool.query(SQLQuery, [id_pembayaran, link_bukti_transfer]);
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

const postPembeliTambahKeranjang = (id_pengguna, id_varian_produk, jumlah_order) => {
    const SQLQuery = `INSERT INTO item_order (id_pengguna, id_varian_produk, jumlah_order) VALUES (?, ?, ?)`;
    return dbPool.query(SQLQuery, [id_pengguna, id_varian_produk, jumlah_order]);
}

const getUsernameLogin = (username) => {
    const SQLQuery = `SELECT id, username, password, nama, email, nomor_telp, role, status FROM pengguna WHERE username = ?`;
    return dbPool.query(SQLQuery, [username]);
}

const postDaftar = (username, password, nama, email, nomor_telp) => {
    const SQLQuery = `INSERT INTO pengguna (username, password, nama, email, nomor_telp, role, status) VALUES (?, ?, ?, ?, ?, 'pembeli', 'pending')`;
    return dbPool.query(SQLQuery, [username, password, nama, email, nomor_telp])
}


const getPendingUsers = () => {
    const query = 'SELECT id, username, nama, email, nomor_telp, created_at FROM pengguna WHERE status = "pending" ';
    return dbPool.query(query);
};

const updateUserStatus = (id, status) => {
    const query = 'UPDATE pengguna SET status = ? WHERE id = ?';
    return dbPool.query(query, [status, id]);
};

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
    postKaryawanTambahAbsensi,
    cekAbensiKaryawan,
    getKaryawanPenjualanOffline,
    postKaryawanTambahPenjualanOffline,
    getAdminTampilAbsensiKaryawan,
    getAdminTampilPengajuanIzinKaryawan,
    getAdminTampilPengajuanIzinKaryawanDetail,
    updateAdminStatusPengajuanIzinKaryawan,
    postAdminTambahProduk,
    postAdminTambahVarianProduk,
    updateProduk,
    updateVarianProduk,
    insertVarianBaru,
    getAdminProduk,
    getAdminVarianProduk,
    deleteAdminProduk,
    deleteAdminVarianProduk,
    getAdminTampilHasilTransaksiOnline,
    getAdminTampilProdukEco,
    postAdminTambahProdukEco,
    updateAdminUbahProdukEco,
    getAdminTampilPenjualanHarianOnline,
    getAdminTampilPenjualanHarianOffline,
    getAdminLaporanTotalHargaOffline,
    getAdminLaporanTotalHargaOnline,
    getAdminHargaAsli,
    getAdminMetodePembayaran,
    getPembeliTampilKeranjang,
    deletePembeliKeranjang,
    postAdminMetodePembayaran,
    updateAdminMetodePembayaran,
    deleteAdminMetodePembayaran,
    getAdminTampilVerifikasiPembayaran,
    updateAdminVerifikasiPembayaran,
    getAdminTampilFakturOnline,
    getAdminTampilUlasanProduk,
    getAdminTampilProdukPerluRestok,
    updateStokVarianProduk,
    getStokVarianProduk,
    kembalikanStokVarianProduk,
    getItemOrderById,
    postPengiriman,
    getAdminTampilPengiriman,
    getAdminTampilPengirimanDetail,
    updateAdminStatusPengiriman,
    getAdminTampilDataAkun,
    postAdminDataAkun,
    deleteAdminDataAkun,
    updateAdminDataAkun,
    getAdminCekDataAkun,
    postHargaAsli,
    updateHargaAsli,
    getChat,
    postChat,
    getChatListPembeli,
    getChatListAdmin,
    getProfilePembeli,
    cekStatusOrderan,
    cekStatusPengiriman,
    getPembeliKomentar,
    deleteKaryawanPengajuanIzin,
    deleteKaryawanPenjualanOffline,
    getPenjualanOfflineById,
    postDataBuktiTransferPembeli,
    postHargaModal,
    updateProdukTanpaGambar,
    updateVarianProdukTanpaGambar,
    getGajiKaryawan,
    postGajiKaryawan,
    updateGajiKaryawan,
    deleteGajiKaryawan,
    tampilDataPenggunaKaryawan,
    ubahStatusGajiKaryawan,
    getGajiKaryawanInfo,
    getPendingUsers,
    updateUserStatus,
    updateProdukDenganGambarDanVideo,
    updateProdukDenganVideo,
    getPenggunaPembeli,
    postIDOrderanLokasiPengiriman,
    getLocation, updateLocation,
    getIdOrderanDikirim, tampilSemuaProduk
 }