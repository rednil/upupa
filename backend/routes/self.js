import express from 'express'
import { loginRequired } from '../auth/tools.js'
const router = express.Router()

/* GET your own user account. */
router.get('/', loginRequired, (req, res, next) => {
  const { username, role } = req.user  
  res.json({username, role})
})

export default router
