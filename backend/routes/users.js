import express from 'express'
import { loginRequired, adminRequired, getHash, createUser } from '../auth/tools.js'
import { ObjectId } from 'mongodb'

var router = express.Router()

const userProjection = {
	_id: true,
	username: true,
	role: true
}
/* GET users listing. */
router.get('/', loginRequired, async (req, res, next) => {
		const {role, username} = req.user
		const query = (role == 'ADMIN') ? {} : {username}
    const users = await req.db
		.collection('users')
		.find(query, userProjection)
		.toArray()
    return res.json(users);
  
})

router.get('/:id', loginRequired, async (req, res, next) => {
	const {role, _id} = req.user
	if(role != 'ADMIN' && _id != req.params.id) return res.status(403).json({error: 'UNAUTHORIZED'})
	const user = await req.db
	.collection('users')
	.findOne(idQuery(req))
  if(user) res.json(user)
	else res.status(404).json({error: 'ID_UNKNOWN'})
})

router.delete('/:id', adminRequired, async (req, res, next) => {
	const result = await req.db
	.collection('users')
	.deleteOne(idQuery(req))
	if(result.deletedCount) res.json()
	else throw ('DELETE_FAILED')
})
router.post('/', adminRequired, async (req, res, next) => {
  const user = await createUser(req, res)
  res.json(user)
})
router.put('/:id', adminRequired, async (req, res, next) => {
	const users = req.db.collection('users')
	const changes = req.body
	const existingUser = await users.findOne(idQuery(req))
	if(changes.username != existingUser.username){
		const conflictingUser = await users.findOne({ username: changes.username })
		if(conflictingUser) throw ('NAME_EXISTS')
	}
	if(changes.password) {
    changes.password = getHash(changes.password)
  }
	const result = await users.updateOne(idQuery(req), {
		$set: changes,
		$currentDate: { updatedAt: true }
	})
	if(result.acknowledged) {
		const modifiedUser = await users.findOne(idQuery(req), userProjection)
		res.json(modifiedUser)
	}
	else throw('WRITE_FAILED')
})

const idQuery = req => ({ _id: new ObjectId(req.params.id) })

export default router

