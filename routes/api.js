var express = require('express');
const upload = require('../middleware/upload');
var router = express.Router();

const apiController = require('../controller/apiController');

//GET DEFAULT
router.get('/login', apiController.login);


//POST DEFAULT
router.post('/daftar', apiController.daftar);

//GET PEMBELI

router.get('/pembeliRiwayatTransaksi/:id', apiController.pembeliRiwayatTransaksi);
router.get('/pembeliRiwayatTransaksiDetail/:id', apiController.pembeliRiwayatTransaksiDetail);

//POST PEMBELI




router.post('/pembeliTambahKeranjang', apiController.pembeliTambahKeranjang);


//UPDATE



//DELETE



//UPLOAD / POST PEMBELI
router.post('/upload', upload.single('bukti_transfer'), apiController.pembeliOrderProduk);

module.exports = router;