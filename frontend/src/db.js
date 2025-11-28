import { mcp } from "./mcp"

const userPrefix = 'org.couchdb.user'

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

export function uuid(length = 10){
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let result = ''
	const charactersLength = characters.length
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength))
	}
	return result
}
async function idStartsWith(str, options){
	options.startkey = str
	options.endkey = str + '\ufff0' 
	if(options.descending) {
		options.startkey = options.endkey
		options.endkey = str
	}
	return await mcp.project.localDB.allDocs(options)
}
export async function getByType(type){
	switch(type){
		case 'user': return await getUsers()
		case 'project': return await getProjects()
		default: {
			return (await idStartsWith(`${type}-`, {
				include_docs: true
			}))
			.rows.map(row => row.doc)
			.sort((a,b) => ('' + a.name).localeCompare(b.name))
		}
	}
}
async function getProjects(){
	return (
		await mcp.db('project')
		.allDocs({include_docs: true})
	)
	.rows.map(row => row.doc)
}
async function getUsers(){
	return (
		await mcp.project.userDB.allDocs({
			startkey: userPrefix,
			endkey: userPrefix + '\ufff0', 
			include_docs: true,
		})
	)
	.rows.map(row => row.doc)
}
export function finalize(item){
	const now = new Date()
	if(!item.type) throw('MISSING_TYPE')
	if(item._id) {
		item.changedAt = now
	}
	else {
		item._id = item.type == 'user'
		? `${userPrefix}:${user.name}`
		: `${item.type}-${uuid()}`
		item.createdAt = now
	}
	if(item.type == 'user' && !user.roles) user.roles = []
	item.user_id = mcp.project.session.userCtx.name
	return item
}