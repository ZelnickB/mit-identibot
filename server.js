const http = require('http')
const express = require('express')
const cookieParser = require('cookie-parser')

const app = express()

app.set('view engine', require('hbs').__express)

app.use(cookieParser())

app.use('/', require('./routes/router'))

http.createServer(app).listen(80)
