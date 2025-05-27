import express from 'express'
import { loginRequired } from '../auth/tools.js'
var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
	return req.mongo.aggregate()
})

export default router

