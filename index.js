const express = require('express')
const app = express()
const moment = require('moment')
const bodyParser = require('body-parser')
const db = require('./src/connection')
const cors = require('cors')
const uuid = require('uuid')
const requestIp = require('request-ip')
const bcrypt = require('bcrypt')
const sign = require('jwt-encode')
const { jwtDecode } = require('jwt-decode')
const { config } = require('dotenv')
const randomstring = require('randomstring')
require('./src/momentCustomLocale')

config()
const port = 3000

// Set CORS options
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(requestIp.mw())

// API access validation
const run = (role, req, res, callback) => {
  if (role == 'admin') {
    if (req.headers.authorization) {
      const [ header, token ] = req.headers.authorization.split(' ')
      const data = jwtDecode(token)
      db.query(`SELECT * FROM users WHERE \`id\` = '${data.id}'`, (error, result) => {
        if (result.length) {
          callback()
        } else {
          res.status(403).json({
            code: 403,
            message: 'FORBIDDEN',
          })
        }
      })
    } else {
      res.status(403).json({
        code: 403,
        message: 'FORBIDDEN',
      })
    }
  } else if (role == 'user') {
    const access_key = req.headers['x-access-key']
    db.query(`SELECT access_key FROM users WHERE access_key = '${access_key}'`, (error, result) => {
      if (result.length) {
        callback()
      } else {
        if (req.headers.authorization) {
          const [ header, token ] = req.headers.authorization.split(' ')
          const data = jwtDecode(token)
          db.query(`SELECT * FROM users WHERE \`id\` = '${data.id}'`, (error, result) => {
            if (result.length) {
              callback()
            } else {
              res.status(403).json({
                code: 403,
                message: 'FORBIDDEN',
              })
            }
          })
        } else {
          res.status(403).json({
            code: 403,
            message: 'FORBIDDEN',
          })
        }
      }
    })
  }
}

// GET default user data
app.get('/api/config', (req, res) => {
  const access_key = req.headers['x-access-key']
  db.query(`SELECT name, can_reply, can_edit, can_delete FROM users WHERE access_key = '${access_key}'`, (error, result) => {
    res.status(200).json({
      code: 200,
      data: result[0]
    })
  })
})

// READ all comments
app.get('/api/comment', (req, res) => {
  run('user', req, res,
    () => {
      const limit = req.query.per ? Number(req.query.per) : 10
      const offset = req.query.next ? Number(req.query.next) : 0
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
    }
  )
})

// CREATE a new comment
app.post('/api/comment', (req, res) => {
  run('user', req, res,
    () => {
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
    }
  )
})

// GET a comment
app.get('/api/comment/:id', (req, res) => {
  run('user', req, res,
    () => {
      const id = req.params.id
      db.query(`SELECT * FROM comments WHERE uuid = '${id}'`, (error, result) => {
        result?.map(item => {
          item['created_at'] = moment(item['created_at']).fromNow()
          item['updated_at'] = moment(item['updated_at']).fromNow()
        })
        res.status(200).json({
          code: 200, 
          data: result[0]
        })
      })
    }
  )
})

// UPDATE a comment
app.put('/api/comment/:id', (req, res) => {
  run('user', req, res,
    () => {
      const id = req.params.id
      const { presence, num_presence, comment } = req.body
      const updated_at = moment().format('YYYY-MM-DD HH:mm:ss')
      db.query(`UPDATE comments SET presence = '${Number(presence)}', num_presence = '${num_presence}', comment = '${comment}', updated_at = '${updated_at}' WHERE own = '${id}'`, (error, result) => {
        res.status(200).json({
          code: 200, 
          data: {
            status: true
          }
        })
      })
    }
  )
})

// DELETE a comment
app.delete('/api/comment/:id', (req, res) => {
  run('user', req, res,
    () => {
      const id = req.params.id
      db.query(`DELETE FROM comments WHERE own = '${id}'`, (error, result) => {
        res.status(200).json({
          code: 200, 
          data: {
            status: true
          }
        })
      })
    }
  )
})

// Login Authentication
app.post('/api/session', (req, res) => {
  let { email, password } = req.body
  db.query(`SELECT id, name, email, password FROM users WHERE email = '${email}'`, async (error, result) => {
    const user = result[0]
    const is_same = await bcrypt.compare(password, user.password)
    if (is_same) {
      let { password, ...data } = user
      const secret = process.env.JWT_KEY
      const token = sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          is_admin: true,
          iat: moment().unix(),
          exp: moment().add(1, 'h').unix(),
          iss: req.headers.host
        }, 
        secret, 
        {
          alg: 'HS256'
        }
      )
      res.status(200).json({
        code: 200,
        data: {
          token: token,
          user: {
            name: user.name,
            email: user.email,
          }
        },
      })
    } else {
      res.status(401).json({
        code: 401,
        message: 'UNAUTHORIZED'
      })
    }
  })
})

// GET user
app.get('/api/user', (req, res) => {
  run('admin', req, res,
    () => {
      const [ header, token ] = req.headers.authorization.split(' ')
      const data = jwtDecode(token)
      db.query(`SELECT * FROM users WHERE email = '${data.email}'`, (error, result) => {
        const { password, ...user } = result[0]
        res.status(200).json({
          code: 200,
          data: user
        })
      })
    }
  )
})

// GET stats
app.get('/api/stats', (req, res) => {
  run('admin', req, res,
    () => {
      const [ header, token ] = req.headers.authorization.split(' ')
      const data = jwtDecode(token)
      db.query(`SELECT * FROM comments WHERE user_id = '${data.id}'`, (error1, result1) => {
        db.query(`SELECT * FROM likes WHERE user_id = '${data.id}'`, (error2, result2) => {
          const present_array = result1.length ? result1.filter(i => i?.presence).map(i => i?.num_presence) : []
          const absent_array = result1.length ? result1.filter(i => !i?.presence).map(i => i?.num_presence) : []
          const present = present_array.length ? present_array.reduce((i, j) => i + j) : 0
          const absent = absent_array.length ? absent_array.reduce((i, j) => i + j) : 0
          const comments = result1.length
          const likes = result2.length
          res.status(200).json({
            code: 200,
            data: {...{ present, absent, likes, comments }}
          })
        })
      })
    }
  )
})

// PATCH to change user name
app.patch('/api/user', (req, res) => {
  run('admin', req, res,
    () => {
      if (req.headers.authorization) {
        const [ header, token ] = req.headers.authorization.split(' ')
        const { id } = jwtDecode(token)
        const { name, filter, can_reply, can_edit, can_delete, old_password, new_password } = req.body
        if ("name" in req.body) {
          db.query(`UPDATE users SET name = '${name}' WHERE id = '${id}'`, (error, result) => {
            res.json({
              code: 200,
              data: { status: true }
            })
          })
        } else if ("filter" in req.body) {
          db.query(`UPDATE users SET is_filter = '${Number(filter)}' WHERE id = '${id}'`, (error, result) => {
            res.json({
              code: 200,
              data: { status: true }
            })
          })
        } else if ("can_reply" in req.body) {
          db.query(`UPDATE users SET can_reply = '${Number(can_reply)}' WHERE id = '${id}'`, (error, result) => {
            res.json({
              code: 200,
              data: { status: true }
            })
          })
        } else if ("can_edit" in req.body) {
          db.query(`UPDATE users SET can_edit = '${Number(can_edit)}' WHERE id = '${id}'`, (error, result) => {
            res.json({
              code: 200,
              data: { status: true }
            })
          })
        } else if ("can_delete" in req.body) {
          db.query(`UPDATE users SET can_delete = '${Number(can_delete)}' WHERE id = '${id}'`, (error, result) => {
            res.json({
              code: 200,
              data: { status: true }
            })
          })
        } else if ("old_password" in req.body && "new_password" in req.body) {
          db.query(`SELECT password FROM users WHERE id = '${id}'`, async (error, result) => {
            const is_same = await bcrypt.compare(old_password, result[0].password)
            if (is_same) {
              const password = await bcrypt.hash(new_password, 10)
              db.query(`UPDATE users SET password = '${password}' WHERE id = '${id}'`, (error, result) => {
                res.json({
                  code: 200,
                  data: { status: true }
                })
              })
            } else {
              res.status(400).json({
                code: 400,
                data: { status: false },
                message: 'PASSWORD DOES NOT MATCH'
              })
            }
          })
        } else {
          res.status(400).json({
            code: 400,
            message: 'BAD REQUEST'
          })
        }
      }
    }
  )
})

// PUT to change access key
app.put('/api/key', (req, res) => {
  run('admin', req, res,
    () => {
      const [ header, token ] = req.headers.authorization.split(' ')
      const { id } = jwtDecode(token)
      const new_access_key = randomstring.generate(50)
      db.query(`UPDATE users SET access_key = '${new_access_key}' WHERE id = '${id}'`, (error, result) => {
        res.json({
          code: 200,
          data: { status: true }
        })
      })
    }
  )
})

// RUN API
app.listen(port, () => {
  console.log(`Wedding invitation backend listening on port ${port}`)
})

module.exports = app
