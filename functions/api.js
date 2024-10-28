const express = require('express')
const serverless = require('serverless-http')
const app = express()
const router = express.Router()
const moment = require('moment')
const bodyParser = require('body-parser')
const db = require('../connection')
const cors = require('cors')
const uuid = require('uuid')
const requestIp = require('request-ip')

moment.locale('id')

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

router.use(cors(corsOptions))
router.use(bodyParser.json())
router.use(requestIp.mw())

router.get('/', (req, res) => {
  res.send('API is running')
  // const limit = req.query.per ? Number(req.query.per) : 10;
  // const offset = req.query.next ? Number(req.query.next) : 0;
  // db.query(`SELECT * FROM comments ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, (error, result) => {
  //   result.map(item => {
  //     item['created_at'] = moment.duration(moment(item['created_at']).diff(moment())).humanize() + ' lalu'
  //     item['updated_at'] = moment.duration(moment(item['updated_at']).diff(moment())).humanize() + ' lalu'
  //   })
  //   res.status(200).json(result)
  // })
})

router.post('/', (req, res) => {
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

app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);

// app.listen(3000, () => {
//   console.log(`Wedding invitation api listening on port ${port}`)
// })
