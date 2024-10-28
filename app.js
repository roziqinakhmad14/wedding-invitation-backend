const express = require('express')
const moment = require('moment')
const bodyParser = require('body-parser')
const db = require('./connection')
const cors = require('cors')
const uuid = require('uuid')
const requestIp = require('request-ip')
const app = express()
const port = 3000

moment.locale('id')

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(requestIp.mw())

app.get('/', (req, res) => {
  db.query('SELECT * FROM comments ORDER BY created_at DESC', (error, result) => {
    result.map(item => {
      item['created_at'] = moment.duration(moment(item['created_at']).diff(moment())).humanize() + ' lalu'
      item['updated_at'] = moment.duration(moment(item['updated_at']).diff(moment())).humanize() + ' lalu'
    })
    res.status(200).json(result)
  })
})

app.post('/', (req, res) => {
  const { name, presence, num_presence, comment } = req.body
  const user_agent = req.headers['user-agent']
  const created_at = moment().format('YYYY-MM-DD HH:mm:ss')
  const updated_at = moment().format('YYYY-MM-DD HH:mm:ss')
  const myuuid = uuid.v4()
  const own = uuid.v4()
  const ip = req.clientIp
  db.query(`INSERT INTO comments VALUES (NULL, '1', '${name}', '${presence}', '${num_presence}', '${comment}', '${created_at}', '${updated_at}', '${myuuid}', '${ip}', '${user_agent}', NULL, '${own}', '0')`, (error, result) => {
    res.status(201).json({
      name: name,
      presence: presence,
      comment: comment,
      uuid: myuuid,
      own: own,
      created_at: moment.duration(moment().diff(moment())).humanize() + ' lalu',
      code: 201,
    })
  })
})

app.listen(port, () => {
  console.log(`Wedding invitation api listening on port ${port}`)
})