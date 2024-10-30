const mysql = require('mysql')
const db = mysql.createConnection({
    host: 'sql12.freesqldatabase.com',
    port: '3306',
    user: 'sql12741106',
    password: 'Mr3GtpgWBh',
    database: 'sql12741106'
})
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'kamu'
// })

module.exports = db