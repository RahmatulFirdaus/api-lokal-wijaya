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

//POST PEMBELI
router.post('/pembeliTambahKeranjang', apiController.pembeliTambahKeranjang);
router.post('/pembeliOrderProduk', apiController.pembeliOrderProduk);



//UPDATE



//DELETE



//UPLOAD
router.post('/upload', upload.single('bukti_transfer'), apiController.uploadBuktiTransfer);

module.exports = router;