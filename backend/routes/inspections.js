import express from 'express'
import { loginRequired } from '../auth/tools.js'
var router = express.Router()

router.get('/', loginRequired, async (req, res, next) => {
	return req.mongo.aggregate()
})
const bandingStartAge = 7
const bandingEndAge = 12
const copyProps = [
	'state',
	'breedingStart',
	'layingStart',
	'hatchDate',
	'reasonForLoss',
	'predator',
	'species_id',
	'nestlingsBanded',
	'femaleBanded',
	'maleBanded',
	'occupator_id'
]

router.post('/', loginRequired, async (req, res, next) => {
	const inspection = req.mongo.body
	inspection.createdAt = req.mongo.timestamp
	inspection.user_id = req.user._id
	const {date, box_id} = inspection
	if(!box_id) return res.status(400).json({box_id: 'MISSING'})
	if(!date) return res.status(400).json({date: 'MISSING'})
	if(inspection.type != 'OUTSIDE'){
		const summaries = req.mongo.db.collection('summaries')
		var summary = await getSummary(req)
		// the getSummary function returns null if the last inhabitant is done
		// and the next one hasn't started laying eggs
		if(summary){
			summary.lastInspection = date
			copyProps.forEach(prop => {
				if(inspection[prop] != null) summary[prop] = inspection[prop]
			})
			if(summary.state != 'STATE_SUCCESS'){
				summary.nestlings = inspection.nestlings
			}
			summary.clutchSize = Math.max(summary.clutchSize, inspection.eggs || 0, inspection.nestlings || 0)
			if(
				summary.state == 'STATE_BREEDING' && 
				!summary.breedingStart &&
				summary.layingStart
			){
				summary.breedingStart = incDate(summary.layingStart, summary.clutchSize)
			}
			if(
				summary.state == 'STATE_EGGS' &&
				!summary.layingStart
			){
				summary.layingStart = incDate(inspection.date, -inspection.eggs)
			}
			if(summary.hatchDate){
				summary.bandingWindowStart = incDate(summary.hatchDate, bandingStartAge)
				summary.bandingWindowEnd = incDate(summary.hatchDate, bandingEndAge)
			}
			if(summary.species_id && summary.occupancy == 0) summary.occupancy = 1
			if(summary._id){
				await summaries.updateOne(
					{_id: summary._id},
					{	$set: summary },
				)
			}
			else {
				await summaries.insertOne(summary)
			}
		}
	}
	await req.mongo.insertOne()
})
function isFinished(summary){
	return (summary.state=='STATE_SUCCESS' || summary.state=='STATE_FAILURE')
}
function isOccupied({state}){
	return (
		state == 'STATE_EGGS' || 
		state == 'STATE_NESTLINGS' ||
		state == 'STATE_BREEDING'
	)
}
async function getSummary (req) {
	const inspection = req.mongo.body
	const {date, box_id} = inspection
	const year = date.getFullYear()
	var summary = await req.mongo.db.collection('summaries')
	.find({box_id, year})
	.sort({occupancy:-1})
	.next()
	var nextOccupancy = false
	if(summary) {
		summary.updatedAt = req.mongo.timestamp
		if(isFinished(summary)){
			if(isOccupied(inspection)){
				nextOccupancy = true
			}
			else{
				// dont create a new occupancy until the new
				// inhabitant actually starts laying eggs
				return null 
			}
		}
	}
	// create a new summary if 
	// (1) this is the first inspection this year
	// (2) the current inhabitant is done and somebody else moved in
	if(!summary || nextOccupancy){
		summary = {
			state: 'STATE_EMPTY',
			year,
			box_id,
			occupancy: (summary?.occupancy || 0) + 1,
			clutchSize: 0,
			nestlingsBanded: 0,
			createdAt: req.mongo.timestamp
		}
	}
	return summary 
}
function incDate(date, days){
	const newDate = new Date(date)
	newDate.setDate(date.getDate() + days)
	return newDate
}
export default router

