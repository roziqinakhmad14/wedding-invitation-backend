const mysql = require('mysql')
const db = mysql.createConnection({
    host: 'sql12.freesqldatabase.com',
    port: '3306',
    user: 'sql12741106',
    password: 'Mr3GtpgWBh',
    database: 'sql12741106'
})

module.exports = db