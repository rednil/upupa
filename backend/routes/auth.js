import express from 'express'
const router = express.Router()
import { createUser, loginRequired } from '../auth/tools.js'
import passport from '../auth/local.js'

router.post('/register', async (req, res, next)  => {
	try{
		await createUser(req, res)
		return login(req, res, next)
	} catch(err) {
    errorResponse(res, 400, (typeof err == 'string') ? err : 'REGISTRATION_FAILED', err.stack)
  }
})

function login(req, res, next){
  passport.authenticate('local', (err, user, info) => {
    if (err) { errorResponse(res, 500, 'AUTHENTICATION_FAILED', err); }
    if (!user) { errorResponse(res, 404, 'WRONG_USERNAME_OR_PASSWORD'); }
    if (user) {
      req.logIn(user, err => {
        if (err) { errorResponse(res, 500, 'LOGIN_FAILED', err) }
        successResponse(res, {...user, password: undefined})
      });
    }
  })(req, res, next)
}

router.post('/login', login)

router.delete('/login', loginRequired, (req, res, next) => {
  req.logout(() => successResponse(res))
})

function successResponse(res, body){
  res.status(200).json(body)
}

function errorResponse(res, status = 500, error = 'UNKNOWN_ERROR', details) {
  const body = {error}
  if(details && process.env.NODE_ENV == 'development') body.details = details
  res.status(status).json(body)
}

export default router
