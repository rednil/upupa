import { ObjectId } from 'mongodb'

class MongoHelper {
	constructor(req, res, next){
		this.req = req
		this.res = res
		this.next = next
		this.history = []
		this.db = req.db
		this.timestamp = new Date()
	}
	async finish(result) {
		console.log('finish', result)
		if(result.acknowledged){
			this.res.json(result)
			// TODO: handle many
			if(this.history.length){
				const result = await this.db.collection('history').insertOne(this.history[0])
				if(!result.acknowledged) console.error(result)
			}
		}
		else{
			this.res.status(400).json(result)
		}
	}
	async insertOne (item = this.req.processedBody, collectionName = this.req.collectionName){
		await this.finish(
			await this.db
			.collection(collectionName)
			.insertOne(item)
		)
	}
	async updateOne(item = this.req.processedBody, collectionName = this.req.collectionName){
		const collection = this.db.collection(collectionName)
		const query = {_id: item._id}
		this.archive(
			await collection.findOne(query), collectionName
		)
		item.updatedAt = this.timestamp
		await this.finish(
			await collection.updateOne(query, {
				$set: item,
			})
		)
	}
	archive(item = this.req.processedBody, collectionName = this.req.collectionName) {
		item.item_id = item._id
		item.user_id = this.req.user._id
		item.supersededAt = this.timestamp
		item.collection = collectionName
		delete item._id
		this.history.push(item)
	}
}

export const preprocessor = (req, res, next) => {
	req.processedQuery = stringToNumber(stringToObjectId(req.query))
	if(req.body) req.processedBody = stringToObjectId(req.body)
	req.timestamp = new Date()
	res.mongo = new MongoHelper(req, res, next)
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