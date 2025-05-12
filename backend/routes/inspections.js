import express from 'express'
import { loginRequired } from '../auth/tools.js'
import { ObjectId } from 'mongodb'

var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
	const inspections = await req.db
	.collection('inspections')
	.find({box_id: new ObjectId(req.query.box_id)})
	.sort({date: -1})
	.toArray()
	return res.json(inspections)
})

export default router

