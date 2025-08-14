var express = require('express');
const upload = require('../middleware/upload');
var router = express.Router();

const apiController = require('../controller/apiController');

//CHAT
router.get('/chat/:id', apiController.authenticateToken, apiController.chat);
router.post('/chat/send', apiController.authenticateToken, apiController.chatPost); 


//BUAT LIST CHAT PEMBELI
router.get('/chatListPembeli', apiController.authenticateToken, apiController.chatListPembeli);
router.get('/chatListAdmin',  apiController.chatListAdmin);

//GET DEFAULT
router.post('/login', apiController.login);

//GET TAMPILAN PRODUK LIST 
router.get('/tampilProduk', apiController.tampilProduk);
router.get('/tampilProdukDetail/:id', apiController.tampilProdukDetail); //id diisi dengan id produk
router.get('/tampilUlasanProduk/:id', apiController.tampilUlasanProduk); //id diisi dengan id produk

router.get('/tampilSemuaProduk', apiController.tampilSemuaProduk);


//POST DEFAULT
router.post('/daftar', apiController.daftar);

//GET PEMBELI
router.get('/pembeliRiwayatTransaksi', apiController.authenticateToken, apiController.pembeliRiwayatTransaksi);
router.get('/pembeliProfile', apiController.authenticateToken,apiController.pembeliProfile); 
router.get('/pembeliCekKomentar/:id', apiController.authenticateToken,apiController.pembeliCekKomentar); //id diisi dengan id varian produk


//id diisi dengan id_orderan
router.get('/pembeliRiwayatTransaksiDetail/:id', apiController.pembeliRiwayatTransaksiDetail);
router.get('/pembeliCekStatus/:id', apiController.pembeliCekStatus); //id diisi dengan id_orderan
router.get('/pembeliCekPengiriman/:id',  apiController.pembeliCekPengiriman); //id diisi dengan id orderan
router.get('/pembeliUlasanProduk/:id', apiController.pembeliUlasanProduk);
router.get('/pembeliFaktur/:id', apiController.pembeliFaktur); //sepaket ama laporan
router.get('/pengiriman/:id', apiController.getPengirimanData);
router.get('/pembeliTampilKeranjang', apiController.authenticateToken,apiController.pembeliTampilKeranjang); //id diisi dengan id pengguna

//GET KARYAWAN
router.get('/karyawanTampilPengajuanIzin', apiController.authenticateToken,apiController.karyawanTampilPengajuanIzin);
router.get('/karyawanTampilTambahProdukPenjualanOffline', apiController.karyawanTampilTambahPenjualanOffline); 


//POST PEMBELI
router.post('/pembeliTambahKomentar', apiController.authenticateToken,apiController.pembeliTambahKomentar);
router.post('/pembeliTambahKeranjang', apiController.authenticateToken, apiController.pembeliTambahKeranjang);

//POST KARYAWAN
router.post('/karyawanTambahPengajuanIzin', apiController.authenticateToken,apiController.karyawanTambahPengajuanIzin);
router.post('/karyawanTambahAbsensi', apiController.authenticateToken,apiController.karyawanTambahAbsensi); //udah pasti absen
router.post('/karyawanTambahPenjualanOffline', apiController.authenticateToken, apiController.karyawanTambahPenjualanOffline); 


//UPDATE

//UPDATE PEMBELI
router.patch('/pembeliUpdateProfilePassword', apiController.authenticateToken, apiController.pembeliProfilePassword);
router.patch('/pembeliUpdateProfileNama', apiController.authenticateToken, apiController.pembeliProfileNama);
router.patch('/pembeliUpdateProfileNomorTelepon', apiController.authenticateToken, apiController.pembeliProfileNomorTelepon);
router.patch('/pembeliUpdateProfileEmail', apiController.authenticateToken, apiController.pembeliProfileEmail);




//DELETE
router.delete('/pembeliDeleteKeranjang/:id', apiController.pembeliDeleteKeranjang); //id diisi dengan id keranjang
router.delete('/karyawanDeleteProdukPenjualanOffline/:id', apiController.karyawanDeleteProdukPenjualanOffline); //id diisi dengan id produk penjualan offline



//UPLOAD / POST PEMBELI
router.post('/pembayaran/upload', upload.array('bukti_transfer', 5), apiController.authenticateToken, apiController.pembeliOrderProduk);



//DELETE KARYAWAN
router.delete('/karyawanDeletePengajuanIzin/:id', apiController.karyawanDeletePengajuanIzin); //id diisi dengan id pengajuan izin



//YANG ADMIN ADMIN AJA

//GET ADMIN
router.get('/adminTampilKaryawanAbsensi', apiController.adminTampilKaryawanAbsensi); //sepaket ama laporan
router.get('/adminTampilKaryawanIzin', apiController.adminTampilKaryawanIzin); //sepaket ama laporan (ini pengajuan izin)
router.get('/adminTampilKaryawanIzinDetail/:id', apiController.adminTampilKaryawanIzinDetail); //sepaket ama laporan (ini pengajuan izin)
//untuk tampilan produk pke api diatas aja
router.get('/adminTampilUpdateProduk/:id', apiController.adminTampilUpdateProduk); 
router.get('/adminTampilHasilTransaksiOnline', apiController.adminTampilHasilTransaksiOnline); //sepaket ama laporan
// router.get('/adminTampilHasilTransaksiPenjualanHarianOnline', apiController.adminTampilHasilTransaksiPenjualanHarianOnline);  // kalo kepake
// router.get('/adminTampilHasilTransaksiPenjualanHarianOffline', apiController.adminTampilHasilTransaksiPenjualanHarianOffline); // kalo kepake
router.get('/adminTampilSemuaHasilTransaksiPenjualanHarian', apiController.adminTampilSemuaHasilTransaksiPenjualanHarian);
router.get('/adminTampilMetodePembayaran', apiController.adminTampilMetodePembayaran);
router.get('/adminTampilVerifikasiPembayaran', apiController.adminTampilVerifikasiPembayaran); //sepaket ama laporan, sama waktu dalam tampil ubahnya
router.get('/adminTampilFakturOnline', apiController.adminTampilFakturOnline); //sepaket ama laporan
//untuk tampilan produk pke api diatas aja
router.get('/adminTampilUlasanProduk/:id', apiController.adminTampilUlasanProduk); //sepaket ama laporan
router.get('/adminTampilProdukPerluRestok', apiController.adminTampilProdukPerluRestok); //sepaket ama laporan
router.get('/adminTampilPengiriman', apiController.adminTampilPengiriman); //sepaket ama laporan tapi ga semua
router.get('/adminTampilPengirimanDetail/:id', apiController.adminTampilPengirimanDetail); //ID diisi dengan id pengiriman
router.get('/adminTampilDataAkun', apiController.adminTampilDataAkun); 

//tambahan diluar rancangan
router.get('/adminTampilProdukEco', apiController.adminTampilProdukEco);


//POST ADMIN
router.post('/adminTambahProduk', upload.array('files', 15), apiController.adminTambahProduk);
router.post('/adminTambahMetodePembayaran', apiController.adminTambahMetodePembayaran);
router.post('/adminTambahAkun', apiController.adminTambahAkun); 

//POST diluar rancangan
router.post('/adminTambahHargaProdukEco', apiController.adminTambahHargaProdukEco);

//UPDATE ADMIN
router.patch('/adminUpdateKaryawanIzin/:id', apiController.adminUpdateKaryawanIzin);
router.patch('/adminUpdateProduk/:id', upload.array('files', 10), apiController.adminUpdateProduk);
router.patch('/adminUpdateMetodePembayaran/:id', apiController.adminUpdateMetodePembayaran); //id diisi dengan id metode pembayaran
router.patch('/adminUpdateVerifikasiPembayaran/:id', apiController.adminUpdateVerifikasiPembayaran); //id diisi dengan id verifikasi pembayaran
router.patch('/adminUpdatePengiriman/:id', apiController.adminUpdatePengiriman); //id diisi dengan id pengiriman
router.patch('/adminUpdateAkun/:id', apiController.adminUpdateAkun); 

//UPDATE diluar rancangan
router.patch('/adminUpdateHargaProdukEco/:id', apiController.adminUpdateHargaProdukEco); //id diisi dengan id produk

//DELETE ADMIN
router.delete('/adminDeleteProduk/:id', apiController.adminDeleteProduk); //id diisi dengan id produk
router.delete('/adminDeleteVarianProduk/:id', apiController.adminDeleteVarianProduk); //id diisi dengan id varian produk
router.delete('/adminDeleteMetodePembayaran/:id', apiController.adminDeleteMetodePembayaran); //id diisi dengan id metode pembayaran
router.delete('/adminDeleteAkun/:id', apiController.adminDeleteAkun); //id diisi dengan id akun



//Laporan Admin External
router.get('/adminLaporanHarian', apiController.adminLaporanHarian); 



//tambahan catatan panelis
router.get('/adminTampilGajiKaryawan', apiController.adminTampilGajiKaryawan);
router.get('/adminTampilDataPenggunaKaryawan', apiController.adminTampilDataPenggunaKaryawan);
router.post('/adminTambahGajiKaryawan', apiController.adminTambahGajiKaryawan);
router.patch('/adminUpdateGajiKaryawan/:id', apiController.adminUpdateGajiKaryawan);
router.delete('/adminDeleteGajiKaryawan/:id', apiController.adminDeleteGajiKaryawan);


//khusus verifikasi daftar akun
router.get('/admin/pending-users', apiController.getPendingUsers);
router.patch('/admin/update-user-status', apiController.updateUserStatus);

//khusus mengambil data ID pengguna dan namanya dengan role pembeli
router.get('/adminTampilDataPenggunaPembeli', apiController.adminTampilDataPenggunaPembeli);
router.get('/adminTampilKeranjang/:id', apiController.adminTampilKeranjang);
router.post('/adminTambahKeranjang/:id', apiController.adminTambahKeranjang);

//khusus lokasi pengiriman
router.post('/update-location', apiController.updateLocation);
router.get('/get-location/:id', apiController.getLocation); //id diisi dengan id orderan
router.get ('/getIDOrderan', apiController.getIDOrderan); //id diisi dengan id pengiriman

//khusus untuk mengetahui jumlah verifikasi akun
router.get('/adminTampilJumlahVerifikasiAkun', apiController.adminTampilJumlahVerifikasiAkun);

module.exports = router;