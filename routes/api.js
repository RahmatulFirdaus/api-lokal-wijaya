var express = require('express');
const upload = require('../middleware/upload');
var router = express.Router();

const apiController = require('../controller/apiController');

//GET DEFAULT
router.get('/login', apiController.login);

//GET TAMPILAN PRODUK LIST
router.get('/tampilProduk', apiController.tampilProduk);
router.get('/tampilProdukDetail/:id', apiController.tampilProdukDetail); //id diisi dengan id produk
router.get('/tampilUlasanProduk/:id', apiController.tampilUlasanProduk); //id diisi dengan id produk


//POST DEFAULT
router.post('/daftar', apiController.daftar);

//GET PEMBELI
//GET RIWAYT TRANSAKSI DIISI DENGAN ID PENGGUNA
router.get('/pembeliRiwayatTransaksi/:id', apiController.pembeliRiwayatTransaksi);


//id diisi dengan id_orderan
router.get('/pembeliRiwayatTransaksiDetail/:id', apiController.pembeliRiwayatTransaksiDetail);
router.get('/pembeliUlasanProduk/:id', apiController.pembeliUlasanProduk);
router.get('/pembeliFaktur/:id', apiController.pembeliFaktur); //sepaket ama laporan
router.get('/pengiriman/:id', apiController.getPengirimanData);
router.get('/pembeliTampilKeranjang/:id', apiController.pembeliTampilKeranjang); //id diisi dengan id pengguna

//GET KARYAWAN
router.get('/karyawanTampilPengajuanIzin/:id', apiController.karyawanTampilPengajuanIzin);
router.get('/karyawanTambahProdukPenjualanOffline', apiController.karyawanTambahProdukPenjualanOffline); 


//POST PEMBELI
router.post('/pembeliTambahKomentar', apiController.pembeliTambahKomentar);
router.post('/pembeliTambahKeranjang', apiController.pembeliTambahKeranjang);

//POST KARYAWAN
router.post('/karyawanTambahPengajuanIzin', apiController.karyawanTambahPengajuanIzin);
router.post('/karyawanTambahAbsensi', apiController.karyawanTambahAbsensi); //udah pasti absen
router.post('/karyawanTambahPenjualanOffline', apiController.karyawanTambahPenjualanOffline); //udah pasti absen


//UPDATE

//UPDATE PEMBELI
router.patch('/pembeliUpdateProfilePassword/:id', apiController.pembeliProfilePassword);
router.patch('/pembeliUpdateProfileNama/:id', apiController.pembeliProfileNama);
router.patch('/pembeliUpdateProfileNomorTelepon/:id', apiController.pembeliProfileNomorTelepon);
router.patch('/pembeliUpdateProfileEmail/:id', apiController.pembeliProfileEmail);




//DELETE
router.delete('/pembeliDeleteKeranjang/:id', apiController.pembeliDeleteKeranjang); //id diisi dengan id keranjang



//UPLOAD / POST PEMBELI
router.post('/upload', upload.single('bukti_transfer'), apiController.pembeliOrderProduk);






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

//tambahan diluar rancangan
router.get('/adminTampilProdukEco', apiController.adminTampilProdukEco);


//POST ADMIN
router.post('/adminTambahProduk', apiController.adminTambahProduk);
router.post('/adminTambahMetodePembayaran', apiController.adminTambahMetodePembayaran);

//POST diluar rancangan
router.post('/adminTambahHargaProdukEco', apiController.adminTambahHargaProdukEco);

//UPDATE ADMIN
router.patch('/adminUpdateKaryawanIzin/:id', apiController.adminUpdateKaryawanIzin);
router.patch('/adminUpdateProduk/:id', apiController.adminUpdateProduk); 
router.patch('/adminUpdateMetodePembayaran/:id', apiController.adminUpdateMetodePembayaran); //id diisi dengan id metode pembayaran
router.patch('/adminUpdateVerifikasiPembayaran/:id', apiController.adminUpdateVerifikasiPembayaran); //id diisi dengan id verifikasi pembayaran
router.patch('/adminUpdatePengiriman/:id', apiController.adminUpdatePengiriman); //id diisi dengan id pengiriman


//UPDATE diluar rancangan
router.patch('/adminUpdateHargaProdukEco', apiController.adminUpdateHargaProdukEco); //id diisi dengan id produk

//DELETE ADMIN
router.delete('/adminDeleteProduk/:id', apiController.adminDeleteProduk); //id diisi dengan id produk
router.delete('/adminDeleteVarianProduk/:id', apiController.adminDeleteVarianProduk); //id diisi dengan id varian produk
router.delete('/adminDeleteMetodePembayaran/:id', apiController.adminDeleteMetodePembayaran); //id diisi dengan id metode pembayaran


//Laporan Admin External
router.get('/adminLaporanHarian', apiController.adminLaporanHarian); 

module.exports = router;