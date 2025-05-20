import express from 'express'
import { loginRequired } from '../auth/tools.js'

var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
	const inspections = await req.db
	.collection('inspections')
	.find(req.processedQuery)
	.sort({date: -1})
	.toArray()
	return res.json(inspections)
})

export default router

