import express from 'express'
import { loginRequired } from '../auth/tools.js'

var router = express.Router()

router.get('/', loginRequired, async (req, res) => {
	return req.mongo.aggregate()
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
