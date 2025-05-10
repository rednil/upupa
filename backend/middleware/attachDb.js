import { getDb } from "../db.js"
export const attachDb = async (req, res, next) => {
  try {
    req.db = await getDb()
    next()
  } catch (error) {
    console.error('Error attaching database to request:', error);
    res.status(500).json({ message: 'Failed to connect to the database' });
  }
}
