import { getDb } from "../db.js"
export const attachDb = async (req, res, next) => {
  try {
    req.db = await getDb()
		const mongoMatch = req.url.match(/\/api\/([^\/]+)/)
		if(mongoMatch) {
			req.collectionName = mongoMatch[1]
			req.collection = req.db.collection(mongoMatch[1])
		}
    next()
  } catch (error) {
		console.log('exception', error)
		throw('No database connection')
  }
}
