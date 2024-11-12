const mysql = require('mysql')
const db = mysql.createConnection({
    host: 'fs1tv.h.filess.io',
    port: '3307',
    user: 'weddinginvitation_efforthot',
    password: '4f5b63221ce1e44ed647c45df13aa49f78f99e3c',
    database: 'weddinginvitation_efforthot'
})
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'kamu'
// })

module.exports = db