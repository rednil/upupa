
import { expect } from 'chai'
import { MongoHelper } from '../middleware/mongo.js'

const query2pipeline = query => new MongoHelper({query}).pipeline

describe('preprocessor', () => {
  describe('cast', () => {
    it('should cast number', () => {
			expect(query2pipeline({x: '3'})).to.eql([{
				"$match": { x: 3 }
			}])
		})
		it('should cast dates', () => {
			const date = '2025-05-05'
			expect(query2pipeline({
				date
			}))
			.to.eql([{
				"$match": { date: new Date(date) }
			}])
		})
		it('should cast ObjectId', () => {
			const id = '68279b29e850352e88be341d'
			const parsedId = query2pipeline({id})[0].$match.id
			expect(parsedId.constructor.name).to.equal('ObjectId')
			expect(parsedId.toString()).to.equal(id)
		})
  })
	describe('operators', () => {
		it('should parse special operators correctly', () => {
			expect(query2pipeline({
				x: '$gte:1'
			}))
			.to.eql([
				{ "$match": { x: { $gte: 1 }} },
			
			])
		})
	})
	describe('meta', () => {
		it('should add a limit parameter to the pipeline', () => {
			expect(query2pipeline({
				$limit: '1'
			}))
			.to.eql([
				{ "$match": {} },
				{ $limit: 1 }
			])
		})
		it('should add a sort parameter to the pipeline', () => {
			expect(query2pipeline({
				$sort: 'x:1'
			}))
			.to.eql([
				{ "$match": {} },
				{ $sort: { x: 1 } }
			])
		})
	})
})

