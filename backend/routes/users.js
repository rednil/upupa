import express from 'express'
import { loginRequired, adminRequired, getHash, createUser } from '../auth/tools.js'
import { ObjectId } from 'mongodb'
var router = express.Router()

const userProjection = {
	_id: true,
	username: true,
	role: true
}
router.get('/', loginRequired, async (req, res, next) => {
	const {role, username} = req.user
	const query = (role == 'ADMIN') ? {} : {username}
	const users = await req.mongo.pathCollection
	.find(query, {projection: userProjection})
	.toArray()
	res.json(users)
})
router.get('/:_id', loginRequired, async (req, res) => {
	console.log('user._id', req.user._id)
	if(req.user.role != 'ADMIN' && req.user._id.toString() != req.params._id){
		return res.status(403).json({error: 'UNAUTHORIZED'})
	}
	const user = await req.mongo.pathCollection
	.findOne({_id: new ObjectId(req.params._id)})
  if(user) res.json(user)
	else res.status(404).json({error: 'ID_UNKNOWN'})
})
router.delete('/', adminRequired, async req => {
	await req.mongo.deleteOne()
})
router.post('/', adminRequired, async (req, res) => {
	const user = await createUser(req, res)
  res.json(user)
})
router.put('/', loginRequired, async (req,res) => {
	const users = req.mongo.pathCollection
	const changes = req.mongo.body
	if(
		(req.user.role != 'ADMIN' && req.user._id.toString() != req.body._id) ||
		(req.user.role != 'ADMIN' && changes.role == 'ADMIN')
	){
		return res.status(403).json({error: 'UNAUTHORIZED'})
	}
	const existingUser = await users.findOne({_id: changes._id})
	if(changes.username != existingUser.username){
		const conflictingUser = await users.findOne({ username: changes.username })
		if(conflictingUser) throw ('NAME_EXISTS')
	}
	if(changes.password) {
    changes.password = getHash(changes.password)
  }
	req.mongo.updateOne()
})

export default router

