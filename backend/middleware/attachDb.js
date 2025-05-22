import { getDb } from "../db.js"
export const attachDb = async (req, res, next) => {
  try {
    req.db = await getDb()
    next()
  } catch (error) {
		console.log('exception', error)
		throw('No database connection')
  }
}
