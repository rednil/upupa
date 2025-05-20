import express from 'express'
import { loginRequired } from '../auth/tools.js'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

let version = 'unknown'
try {
  const packageJsonPath = path.join(__dirname, '../../package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  version = packageJson.version
} catch (error) {
  console.error('Failed to read package.json version:', error.message)
}
console.log('Serving version', version)

/* GET your own user account. */
router.get('/', loginRequired, (req, res) => {
  const { username, role } = req.user  
  res.json({username, role, version})
})

export default router
