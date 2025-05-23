import express from 'express'
import { loginRequired } from '../auth/tools.js'

var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
	const species = await req.db
	.collection('species')
	.find({})
	.toArray()
	return res.json(species)
})

router.post('/', loginRequired, async (req, res, next) => {
	await res.mongo.insertOne()
})
router.put('/:_id', loginRequired, async (req, res, next) => {
	await res.mongo.updateOne()
})
export default router
