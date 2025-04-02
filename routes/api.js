var express = require('express');
var router = express.Router();

const apiController = require('../controller/apiController');

//GET
router.get('/login', apiController.login);


//POST
router.post('/daftar', apiController.daftar);


//UPDATE



//DELETE

module.exports = router;