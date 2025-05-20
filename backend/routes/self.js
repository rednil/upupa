import express from 'express'
import { loginRequired } from '../auth/tools.js'
const router = express.Router()

/* GET your own user account. */
router.get('/', loginRequired, (req, res, next) => {
  const { username, role } = req.user
	const version = "__APP_VERSION__" // replaced by top level npm build:docker
  res.json({username, role, version})
})

export default router
