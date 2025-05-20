import express from 'express'
import { loginRequired } from '../auth/tools.js'

var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
	const summaries = await req.db
	.collection('summaries')
	.find(req.processedQuery)
	.sort({occupancy: -1})
	.toArray()
	return res.json(summaries)
})

export default router

