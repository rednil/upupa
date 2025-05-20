import { ObjectId } from 'mongodb'

export const objectIdConverter = (req, res, next) => {
	const query = { ...req.query }
  Object.entries(query).forEach(([key, value]) => {
    if (key.endsWith('_id') && typeof value === 'string') {
			query[key] = new ObjectId(value)
		}
		else if (value!='' && !isNaN(value)){
			query[key] = Number(value)
		}
	})
	req.processedQuery = query
  next()
}
