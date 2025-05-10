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
  let { username, password, role } = req.body
  if(!username || username=='') throw('USERNAME_MISSING')
  if(!password || password=='') throw('PASSWORD_MISSING')
	if(role!='ADMIN') role = 'USER'
  if(password.length<3) throw ('PASSWORD_TOO_SHORT')
	const users = req.db.collection('users')
  const existing = await users.findOne({ username })
  if(existing) throw('USER_EXISTS')
  const hash = getHash(password)
  const result = await users.insertOne({
    username,
    password: hash,
    createdAt: new Date(),
		role
  })
	return {
		username,
		_id: result.insertedId,
		role
	}
}

export function getHash(password){
  const salt = bcrypt.genSaltSync()
  return bcrypt.hashSync(password, salt)
}

