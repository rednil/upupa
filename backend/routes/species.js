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

export default router

