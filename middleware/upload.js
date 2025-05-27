// middleware/upload.js
const multer = require('multer');
const path = require('path');

// Tentukan lokasi penyimpanan dan penamaan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // folder tempat menyimpan file
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext); // nama file unik + ekstensi asli
  }
});

// Filter tipe file
const fileFilter = (req, file, cb) => {
  console.log('DEBUG mimetype:', file.mimetype);
  if (/^image\/(jpeg|png)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;
