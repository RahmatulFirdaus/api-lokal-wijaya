const db = require('mysql2');

const dbPool = db.createPool({
    host: "localhost",
    user: "root",
    password:"",
    database: "wijayaproject",
})

module.exports = dbPool.promise();