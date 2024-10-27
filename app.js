const express = require('express')
const bodyParser = require('body-parser')
const db = require('./connection')
const app = express()
const port = 3000

app.use(bodyParser.json())

app.get('/', (req, res) => {
  db.query('SELECT * FROM comments', (error, result) => {
    res.send(result)
  })
})

app.post('/', (req, res) => {
  const { name, presence, numPresence, comment, token } = req.body;
  db.query(`INSERT INTO comments VALUES (NULL, '${name}', '${presence}', '${numPresence}', '${comment}', '${token}')`, (error, result) => {
    res.send(result)
  })
})

app.listen(port, () => {
  console.log(`Wedding invitation api listening on port ${port}`)
})