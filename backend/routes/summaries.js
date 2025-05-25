import express from 'express'
import { loginRequired } from '../auth/tools.js'

var router = express.Router()

router.get('/', loginRequired, async (req, res) => {
	const summaries = await req.mongo.pathCollection
	.find(req.mongo.query)
	.sort({occupancy: -1})
	.toArray()
	return res.json(summaries)
})

export default router

