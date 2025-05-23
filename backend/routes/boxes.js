import express from 'express'
import { loginRequired } from '../auth/tools.js'
import { ObjectId } from 'mongodb'

var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
    const boxes = await req.db
		.collection('boxes')
		.find()
		.sort({name: 1})
		.toArray()
    return res.json(boxes);
  
})

router.post('/', loginRequired, async (req, res, next) => {
	const boxes = req.db.collection('boxes')
	const result = await boxes.insertOne(req.processedBody)
	if(result.acknowledged) {
		const box = await boxes.findOne({_id: result.insertedId})
		res.json(box)
	}
})

router.put('/:id', loginRequired, async (req, res, next) => {
	const _id = new ObjectId(req.params.id)
	const changes = req.processedBody
	const boxes = req.db.collection('boxes')
	const oldItem = await boxes.findOne({_id})
	changes.updatedAt = req.timestamp
	const result = await boxes
	.updateOne({_id}, {
		$set: changes,
	})
	if(result.acknowledged) {
		const box = await boxes.findOne({_id})
		res.json(box)
		archive(req, 'boxes', oldItem)
		next()
	}
	else {
		console.log('result', result)
		throw('WRITE_FAILED')
	}
	
})
export default router

const archive = async (req, collectionName, item) => {
	item.item_id = item._id
	item.user_id = req.user._id
	item.supersededAt = req.timestamp
	item.collection = collectionName
	delete item._id
	const trashResult = await req.db.collection('history').insertOne(item)
}