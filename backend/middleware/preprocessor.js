import { ObjectId } from 'mongodb'
import { getDb } from "../db.js"

class MongoHelper {
	constructor(req, res, next){
		this.req = req
		this.res = res
		this.next = next
		this.history = []
		const mongoMatch = req.url.match(/\/api\/([^\/?]+)/)
		if(mongoMatch) {
			this.pathCollectionName = mongoMatch[1]
		}
		this.query = stringToNumber(stringToObjectId(req.query))
		if(req.body) this.body = stringToObjectId(req.body)
		this.timestamp = new Date()
	}
	async attachDb(){
		this.db = await getDb()
		if(this.pathCollectionName){
			this.pathCollection = this.db.collection(this.pathCollectionName)
		}
	}
	async finish(result) {
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
	async insertOne (item = this.body, collectionName = this.pathCollectionName){
		await this.finish(
			await this.db
			.collection(collectionName)
			.insertOne(item)
		)
	}
	async deleteOne (item = this.body, collectionName = this.pathCollectionName){
		
		await this.finish(
			await this.db
			.collection(collectionName)
			.deleteOne({_id: item._id})
		)
	}
	async updateOne(item = this.body, collectionName = this.pathCollectionName){
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
	archive(item = this.body, collectionName = this.pathCollectionName) {
		item.item_id = item._id
		item.user_id = this.req.user._id
		item.supersededAt = this.timestamp
		item.collection = collectionName
		delete item._id
		this.history.push(item)
	}
}

export const preprocessor = async (req, res, next) => {
	req.mongo = new MongoHelper(req, res, next)
	await req.mongo.attachDb()
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