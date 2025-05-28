import express from 'express'
import { loginRequired, adminRequired } from '../auth/tools.js'
const router = express.Router()

/* GET your own user account. */
router.get('/', loginRequired, (req, res, next) => {
  const { username, role } = req.user
	const version = "__APP_VERSION__" // replaced by top level npm build:docker
  res.json({username, role, version})
})

// hack to clear the database for imports
router.delete('/:collection', adminRequired, async (req, res, next) => {
	res.json(await req.mongo.db.collection(req.params.collection).drop())
})

export default router
