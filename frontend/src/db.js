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

const arr2Obj = (arrDef, arr) => {
	return arrDef.reduce((obj, val, idx) => {
		obj[val] = arr[idx]
		return obj
	}, {})
}

const parseValue = value => arr2Obj(SUMMARY_DEF_VALUE, value)
const parseKey = key => arr2Obj(SUMMARY_DEF_KEY, key)

export async function getAllSummaries(){
	return (
		await mcp.db().query('upupa/stats_by_state_year_species', {
			reduce: false
		})
	)
	.rows
	.map(({key, value}) => ({
		key: parseKey(key),
		value: parseValue(value)
	}))
}

export async function getStats(reverse = false){
	const response = await mcp.db()
	.query('upupa/stats_by_state_year_species', {
		group: true,
		group_level: 3
	})
	
	return response.rows.reduce((obj, {key, value}) => {
		if(reverse) key = key.toReversed()
		Object.assign(key.reduce((obj, prop) => {
			obj[prop] = obj[prop] || {}
			return obj[prop]
		}, obj), parseValue(value))
		return obj
	}, {})
	
}

export async function getStatsBySpeciesYearState(){
	return getStats(true)
}