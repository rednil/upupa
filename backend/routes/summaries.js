import express from 'express'
import { loginRequired } from '../auth/tools.js'
import { ObjectId } from 'mongodb'

var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
	const query = {}
	if(req.query.box_id) query.box_id = new ObjectId(req.query.box_id)
	const summaries = await req.db
	.collection('summaries')
	.find(query)
	.sort({occupancy: -1})
	.toArray()
	return res.json(summaries)
})

export default router

