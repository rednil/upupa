import passport from 'passport'
import LocalStrategy from 'passport-local'
import { compareSync } from 'bcrypt'
import { getDb } from '../db.js'

const options = {}

passport.serializeUser((user, done) => {
  done(null, user._id)
})

passport.deserializeUser(async (_id, done) => {
	const db = await getDb()
	const user = await db.collection('users').findOne({_id})
  if(user) return done(null, user)
	done('USER_UNKNOWN', null)
})

passport.use(new LocalStrategy(options, async (username, password, done) => {
  // check to see if the username exists
	const db = await getDb()
	const user = await db.collection('users').findOne({username})
	
  if (user && compareSync(password, user.password)) return done(null, user)
  return done(null, false)
}))

export default passport
