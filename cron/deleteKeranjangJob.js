const cron = require('node-cron');
const { hapusItemKeranjangKadaluarsa } = require('../controller/apiController');

// Jalankan setiap menit
cron.schedule('0 0 * * *', async () => {
    console.log(`[⏰ ${new Date().toLocaleString()}] Cron job harian berjalan...`);
    await hapusItemKeranjangKadaluarsa();
});