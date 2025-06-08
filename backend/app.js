const environment = process.env.NODE_ENV = process.env.NODE_ENV || 'development'

import express from 'express'
import createHttpError from 'http-errors'
import morgan from 'morgan'
import { fileURLToPath } from 'url'
import path from 'path'
import couch from './routes/couch.js'
import { ensureDesignDocument } from './design.js'

//await ensureDesignDocument()

var app = express()
if(environment != 'test') app.use(morgan('dev'))
app.use('/api/couch', couch)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, 'public')))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createHttpError(404))
})

// error handler
app.use(function(err, req, res, next) {
	console.log(err)
  const body = {
    error: err.message
  }
  if(environment == 'development') body.stack = err.stack?.split('\n')
  res.status(err.status || 500).json(body)
})

export default app