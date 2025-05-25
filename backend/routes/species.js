import express from 'express'
import { loginRequired } from '../auth/tools.js'

var router = express.Router()

router.get('/', loginRequired, async (req, res) => {
	const species = await req.mongo.pathCollection
	.find({})
	.toArray()
	return res.json(species)
})

router.post('/', loginRequired, async req => {
	await req.mongo.insertOne()
})
router.put('/', loginRequired, async req => {
	await req.mongo.updateOne()
})
router.delete('/', loginRequired, async req => {
	await req.mongo.deleteOne()
})
export default router
