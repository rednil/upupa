import express from 'express'
import { loginRequired } from '../auth/tools.js'

var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
    const boxes = await req.mongo.pathCollection
		.find()
		.sort({name: 1})
		.toArray()
    return res.json(boxes)
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

