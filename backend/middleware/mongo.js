import { ObjectId } from 'mongodb'
import { getDb } from "../db.js"

export const attachMongoHelper = async (req, res, next) => {
	req.mongo = new MongoHelper(req, res, next)
	await req.mongo.attachDb()
	next()
}

export class MongoHelper {
	constructor(req, res, next){
		this.req = req
		this.res = res
		this.next = next
		this.history = []
		const mongoMatch = req.url?.match(/\/api\/([^\/?]+)/)
		if(mongoMatch) {
			this.pathCollectionName = mongoMatch[1]
		}
		this.pipeline = parseQuery(req.query)
		this.query = this.pipeline[0].$match
		if(req.body) this.body = castObjValues(req.body)
		this.timestamp = new Date()
	}
	async aggregate(){
		return this.res.json(
			await this.pathCollection
			.aggregate(this.pipeline)
			.toArray()
		)
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



const castObjValues = obj => 
	Object.fromEntries(
		Object.entries(obj)
		.map(
			([key, value]) => [key, cast(value)]
		)
	)

const cast = str => {
	if(typeof(str) != 'string') return str
	if(str.match(/\d\d\d\d-\d\d-\d\d/)) return new Date(str)
	if(str!='' && !isNaN(str)) return Number(str)
	if(str.match(/[0-9a-fA-F]{24}/)) return new ObjectId(str)
	return str
}

export const parseQuery = query => {
	const pipeline = [
		{ $match: {} }
	]
	Object.entries(query).forEach(([key, str]) => {
		const arr = str.split(':')
		var operand = cast(arr.length>1 ? arr[1] : str)
		var value = arr.length>1 ? {[arr[0]]: operand} : operand
		if(key.startsWith('$')) pipeline.push({[key]: value})
		else pipeline[0].$match[key] = value
	})
	return pipeline
}