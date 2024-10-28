const express = require('express')
const moment = require('moment')
const bodyParser = require('body-parser')
const db = require('./connection')
const cors = require('cors')
const app = express()
const port = 3000

let corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(bodyParser.json())

moment.locale('id')

app.get('/', (req, res) => {
  db.query('SELECT * FROM comments', (error, result) => {
    result.map(item => {
      item['created_at'] = moment.duration(moment(item['created_at']).diff(moment())).humanize() + ' lalu'
      item['updated_at'] = moment.duration(moment(item['updated_at']).diff(moment())).humanize() + ' lalu'
    }
    )
    res.status(200).json(result)
  })
})

app.post('/', (req, res) => {
  const { name, presence, numPresence, comment, token } = req.body
  const createdAt = moment().format('YYYY-MM-DD HH:mm:ss')
  const updatedAt = moment().format('YYYY-MM-DD HH:mm:ss')
  db.query(`INSERT INTO comments VALUES (NULL, '${name}', '${presence}', '${numPresence}', '${comment}', '${token}', '${createdAt}', '${updatedAt}')`, (error, result) => {
    res.send(result)
  })
})

app.listen(port, () => {
  console.log(`Wedding invitation api listening on port ${port}`)
})