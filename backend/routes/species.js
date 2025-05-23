import express from 'express'
import { loginRequired } from '../auth/tools.js'

var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
	const species = await req.db
	.collection('species')
	.find({})
	.toArray()
	return res.json(species)
})

router.post('/', loginRequired, async (req, res, next) => {
	const boxes = req.db.collection('species')
	res.json(await boxes.insertOne(req.processedBody))
})
router.put('/:id', loginRequired, async (req, res, next) => {
	const _id = new ObjectId(req.params.id)
	const changes = req.processedBody
	const oldItem = await collection(req).findOne({_id})
	changes.updatedAt = req.timestamp
	const result = await collection(req)
	.updateOne({_id}, {
		$set: changes,
	})
	if(result.acknowledged) {
		const box = await collection(req).findOne({_id})
		res.json(box)
		archive(req, 'species', oldItem)
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

const collection = req => req.db.collection('species')