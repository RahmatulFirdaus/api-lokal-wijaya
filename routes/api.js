var express = require('express');
var router = express.Router();

const apiController = require('../controller/apiController');

//GET DEFAULT
router.get('/login', apiController.login);


//POST DEFAULT
router.post('/daftar', apiController.daftar);

//POST PEMBELI
router.post('/pembeliTambahKeranjang', apiController.pembeliTambahKeranjang);


//UPDATE



//DELETE

module.exports = router;