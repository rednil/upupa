import { ObjectId } from 'mongodb'

export const queryProcessor = (req, res, next) => {
	req.processedQuery = stringToNumber(stringToObjectId(req.query))
	if(req.body) req.processedBody = stringToObjectId(req.body)
	req.timestamp = new Date()
  next()
}

const stringToObjectId = obj => {
	const result = {}
	Object.entries(obj).forEach(([key, value]) => {
		result[key] = (key.endsWith('_id') && typeof value === 'string') ?
		new ObjectId(value) : value
	})
	return result
}
const stringToNumber = obj => {
	const result = {}
	Object.entries(obj).forEach(([key, value]) => {
		result[key] = (value!='' && !isNaN(value)) ?
		new Number(value) : value
	})
	return result
}