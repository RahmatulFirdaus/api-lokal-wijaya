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
router.get('/pembeliFaktur/:id', apiController.pembeliFaktur);
router.get('/pengiriman/:id', apiController.getPengirimanData);

//GET KARYAWAN
router.get('/karyawanTampilPengajuanIzin/:id', apiController.karyawanTampilPengajuanIzin);


//POST PEMBELI
router.post('/pembeliTambahKomentar', apiController.pembeliTambahKomentar);
router.post('/pembeliTambahKeranjang', apiController.pembeliTambahKeranjang);


//UPDATE

//UPDATE PEMBELI
router.patch('/pembeliUpdateProfilePassword/:id', apiController.pembeliProfilePassword);
router.patch('/pembeliUpdateProfileNama/:id', apiController.pembeliProfileNama);
router.patch('/pembeliUpdateProfileNomorTelepon/:id', apiController.pembeliProfileNomorTelepon);
router.patch('/pembeliUpdateProfileEmail/:id', apiController.pembeliProfileEmail);




//DELETE



//UPLOAD / POST PEMBELI
router.post('/upload', upload.single('bukti_transfer'), apiController.pembeliOrderProduk);

module.exports = router;