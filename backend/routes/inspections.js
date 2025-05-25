import express from 'express'
import { loginRequired } from '../auth/tools.js'
import { ObjectId } from 'mongodb'
var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
	const inspections = await req.mongo.pathCollection
	.find(req.mongo.query)
	.sort({date: -1})
	.toArray()
	console.log('inspections', req.mongo.query, inspections)
	return res.json(inspections)
})

export default router

