import bcrypt from 'bcrypt'

export function adminRequired(req, res, next){
  if (!req.user) return res.status(401).json({error: 'UNAUTHENTICATED'})
  if (req.user.role != 'ADMIN') return res.status(403).json({error: 'UNAUTHORIZED'})
  return next()
}
export function loginRequired(req, res, next) {
  if (!req.user) return res.status(401).json({error: 'UNAUTHENTICATED'})
  return next()
}

export async function createUser(req) {
	const body = req.mongo.body
  if(!body.username || body.username=='') throw('USERNAME_MISSING')
  if(!body.password || body.password=='') throw('PASSWORD_MISSING')
	if(body.role!='ADMIN') body.role = 'USER'
  if(body.password.length<3) throw ('PASSWORD_TOO_SHORT')
	// dont use mongo.pathCollection, we might be called from /register
	const users = req.mongo.db.collection('users')
	const existing = await users.findOne({ username: body.username })
  if(existing) throw('USER_EXISTS')
  body.password = getHash(body.password)
	await req.mongo.insertOne(body, 'users')
}

export function getHash(password){
  const salt = bcrypt.genSaltSync()
  return bcrypt.hashSync(password, salt)
}

