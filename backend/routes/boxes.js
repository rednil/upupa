import express from 'express'
import { loginRequired } from '../auth/tools.js'

var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
    const boxes = await req.db
		.collection('boxes')
		.find()
		.sort({label: 1})
		.toArray()
    return res.json(boxes);
  
})

export default router

