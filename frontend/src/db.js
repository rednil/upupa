import { mcp } from "./mcp"

const SUMMARY_DEF_VALUE = [
	'clutchSize',
	'nestlings',
	'nestlingsBanded',
	'layingStart',
	'breedingStart',
	'hatchDate'
]

const SUMMARY_DEF_KEY = [
	'state',
	'year',
	'species_id',
	'occupancy'
]
const PERPETRATOR_DEF_KEY = [
	'perpetrator_id',
	'year',
	'week'
]
const arr2Obj = (arrDef, arr) => {
	return arrDef.reduce((obj, val, idx) => {
		obj[val] = arr[idx]
		return obj
	}, {})
}

export const parsePerpetratorsKey = keyArr => arr2Obj(PERPETRATOR_DEF_KEY, keyArr)
const parseStatsValue = value => arr2Obj(SUMMARY_DEF_VALUE, value)
const parseStatsKey = key => arr2Obj(SUMMARY_DEF_KEY, key)

export async function getAllSummaries(){
	return (
		await mcp.db().query('upupa/stats', {
			reduce: false
		})
	)
	.rows
	.map(({key, value}) => ({
		key: parseStatsKey(key),
		value: parseStatsValue(value)
	}))
}

export async function getStats(reverse = false){
	const response = await mcp.db()
	.query('upupa/stats', {
		group: true,
		group_level: 3
	})
	
	return response.rows.reduce((obj, {key, value}) => {
		if(reverse) key = key.toReversed()
		Object.assign(key.reduce((obj, prop) => {
			obj[prop] = obj[prop] || {}
			return obj[prop]
		}, obj), parseStatsValue(value))
		return obj
	}, {})
	
}

export async function getStatsBySpeciesYearState(){
	return getStats(true)
}