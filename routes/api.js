var express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'assets/data', limits: { fileSize: 10000000 } });
var router = express.Router();

const apiController = require('../controller/apiController');

//GET DEFAULT
router.get('/login', apiController.login);


//POST DEFAULT
router.post('/daftar', apiController.daftar);

//POST PEMBELI
router.post('/pembeliTambahKeranjang', apiController.pembeliTambahKeranjang);
router.post('/pembeliOrderProduk', apiController.pembeliOrderProduk);


//UPDATE



//DELETE

module.exports = router;