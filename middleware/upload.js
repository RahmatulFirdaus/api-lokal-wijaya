// middleware/upload.js
const multer = require('multer');
const path = require('path');

// Tentukan lokasi penyimpanan dan penamaan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // semua file disimpan di folder uploads
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext); // nama file unik + ekstensi asli
  }
});

// Filter tipe file - terima gambar dan video
const fileFilter = (req, file, cb) => {
  console.log('DEBUG mimetype:', file.mimetype);
  
  // Terima gambar (JPEG, PNG)
  if (/^image\/(jpeg|png)$/.test(file.mimetype)) {
    cb(null, true);
  } 
  // Terima video (MP4, MOV, AVI)
  else if (/^video\/(mp4|quicktime|x-msvideo)$/.test(file.mimetype)) {
    cb(null, true);
  } 
  else {
    cb(new Error('Only JPEG, PNG images and MP4, MOV, AVI videos are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit untuk video
  }
});

module.exports = upload;