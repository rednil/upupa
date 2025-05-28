const environment = process.env.NODE_ENV = process.env.NODE_ENV || 'development'

import express from 'express'
import createHttpError from 'http-errors'
import { uri, DATABASE_NAME } from './db.js'
import morgan from 'morgan'
import session from 'express-session'
import passport from 'passport'
import { fileURLToPath } from 'url'
import path from 'path'
import MongoStore from 'connect-mongo'
import { attachMongoHelper } from './middleware/mongo.js'
import selfRouter from './routes/self.js'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import boxesRouter from './routes/boxes.js'
import inspectionsRouter from './routes/inspections.js'
import summariesRouter from './routes/summaries.js'
import speciesRouter from './routes/species.js'

const store = MongoStore.create({
	mongoUrl: uri,
	dbName: DATABASE_NAME,
	collectionName: 'sessions',
	stringify: false
	
})

var app = express()

if(environment != 'test') app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, 'public')))


app.use(session({
  secret: process.env.SESSION_SECRET || 'Keyboard Cat',
  resave: false,
  saveUninitialized: true,
  store,
	cookie: {
		secure: !(environment == 'development'),
	}
}))
app.use(attachMongoHelper)
app.use(passport.initialize())
app.use(passport.session())

app.use('/api/self', selfRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/boxes', boxesRouter)
app.use('/api/inspections', inspectionsRouter)
app.use('/api/summaries', summariesRouter)
app.use('/api/species', speciesRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createHttpError(404))
});

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