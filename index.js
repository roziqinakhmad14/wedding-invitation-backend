const express = require('express')
const app = express()
const moment = require('moment')
const bodyParser = require('body-parser')
const db = require('./connection')
const cors = require('cors')
const uuid = require('uuid')
const requestIp = require('request-ip')
const port = 3000

moment.locale('id')
moment.updateLocale('id', {
  weekdays: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at', 'Sabtu'],
  weekdaysShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  months: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  relativeTime : {
      future : '%s yang akan datang',
      past : '%s yang lalu',
      s: 'Beberapa detik',
      ss : '%d detik',
      m:  '1 menit',
      mm: '%d menit',
      h:  '1 jam',
      hh: '%d jam',
      d:  '1 hari',
      dd: '%d hari',
      w:  '1 minggu',
      ww: '%d minggu',
      M:  '1 bulan',
      MM: '%d bulan',
      y:  '1 tahun',
      yy: '%d tahun'
  },
});

// Set CORS options
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(requestIp.mw())

// GET default user data
app.get('/api/config', (req, res) => {
  const access_key = req.headers['x-access-key']
  db.query(`SELECT * FROM users WHERE access_key LIKE '${access_key}'`, (error, result) => {
    res.status(200).json({
      code: 200,
      data: result[0]
    })
  })
})

// READ all comments
app.get('/api/comment', (req, res) => {
  const limit = req.query.per ? Number(req.query.per) : 10;
  const offset = req.query.next ? Number(req.query.next) : 0;
  db.query(`SELECT * FROM comments ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, (error, result) => {
    result?.map(item => {
      item['created_at'] = moment(item['created_at']).fromNow()
      item['updated_at'] = moment(item['updated_at']).fromNow()
    })
    res.status(200).json({
      code: 200,
      data: result
    })
  })
})

// CREATE a new comment
app.post('/api/comment', (req, res) => {
  const { name, presence, num_presence, comment } = req.body
  const user_agent = req.headers['user-agent']
  const created_at = moment().format('YYYY-MM-DD HH:mm:ss')
  const updated_at = moment().format('YYYY-MM-DD HH:mm:ss')
  const myuuid = uuid.v4()
  const own = uuid.v4()
  const ip = req.clientIp
  db.query(`INSERT INTO comments VALUES (NULL, '1', '${name}', '${Number(presence)}', '${num_presence}', '${comment}', '${created_at}', '${updated_at}', '${myuuid}', '${ip}', '${user_agent}', NULL, '${own}', '0')`, (error, result) => {
    res.status(201).json({
      code: 201,
      data: {
        name: name,
        presence: presence,
        comment: comment,
        uuid: myuuid,
        own: own,
        created_at: moment().fromNow(),
      },
    })
  })
})

// GET a comment
app.get('/api/comment/:id', (req, res) => {
  const id = req.params.id
  db.query(`SELECT * FROM comments WHERE uuid LIKE '${id}'`, (error, result) => {
    result?.map(item => {
      item['created_at'] = moment(item['created_at']).fromNow()
      item['updated_at'] = moment(item['updated_at']).fromNow()
    })
    res.status(200).json({
      code: 200, 
      data: result[0]
    })
  })
})

// UPDATE a comment
app.put('/api/comment/:id', (req, res) => {
  const id = req.params.id
  const { presence, num_presence, comment } = req.body
  db.query(`UPDATE comments SET presence = '${presence}', num_presence = '${num_presence}', comment = '${comment}' WHERE own LIKE '${id}'`, (error, result) => {
    res.status(200).json({
      code: 200, 
      data: {
        status: 200
      }
    })
  })
})

// DELETE a comment
app.delete('/api/comment/:id', (req, res) => {
  const id = req.params.id
  db.query(`DELETE FROM comments WHERE own LIKE '${id}'`, (error, result) => {
    res.status(200).json({
      code: 200, 
      data: {
        status: 200
      }
    })
  })
})

// RUN API
app.listen(port, () => {
  console.log(`Wedding invitation backend listening on port ${port}`)
})

module.exports = app; 
