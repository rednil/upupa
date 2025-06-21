import PouchDB from 'pouchdb'
import XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'
import parser from './parser.js'
import { auth, ensureDesignDocument, DB_URL } from '../backend/db.js'
import PouchDBSecurityHelper from 'pouchdb-security-helper'

PouchDB.plugin(PouchDBSecurityHelper)

const bandingStartAge = 7
const bandingEndAge = 12


/*
const designDocs = await db.allDocs({
	startkey: "_design/",
	endkey: "_design0",
	include_docs: true
})
*/

const oldDb = new PouchDB(DB_URL, {auth})
const oldSecurity = oldDb.security()
await oldSecurity.fetch()

await oldDb.destroy()
const db = new PouchDB(DB_URL, {auth})

const newSecurity = db.security()
await newSecurity.fetch()
newSecurity.members = oldSecurity.members
newSecurity.admins = oldSecurity.admins

await newSecurity.save()
await ensureDesignDocument(db)
/*
await db.bulkDocs(designDocs.rows.map(doc => {
	delete doc.doc._rev
	return doc.doc
}))
*/
const oneBoxOnly = process.argv[2]
const dataPath = 'data/2025-06-17.ods'

const idCache = {}


const workbook = getWorkbook()
const docs = []
console.log(Object.keys(workbook.Sheets))
await importBoxes(XLSX.utils.sheet_to_json(workbook.Sheets.Box_Status))
await importInspections(XLSX.utils.sheet_to_json(workbook.Sheets['Breeding (25)']))

docs.map(doc => console.log(removeIDs(doc)))
await db.bulkDocs(docs)


function getWorkbook(){
	// Get the directory name using import.meta.url
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	// Construct the full path to the 'data.ods' file
	const filePath = path.join(__dirname, dataPath);
	// Read the .ods file
	return XLSX.readFile(filePath)
}

function incDate(date, days){
	const newDate = new Date(date)
	newDate.setDate(newDate.getDate() + days)
	return newDate
}

async function importBoxes(json){
	//console.log(`drop boxes`, (await agent.delete('/api/self/boxes')).status)
	for(var i=0; i<json.length; i++){
		const entry = json[i]
		var name = entry['Nistkastennr.']
		if(!name) continue
		const box = {
			type: 'box',
			name: fixBoxName(name),
			site: entry['Standort'],
			lat: entry['Breite'] || entry['Breite_1'],
			lon: entry['Länge'] || entry['Länge_1']
		}
		if(!box.name || !box.site) continue
		getId('box', box)
		
	}
}

function fixBoxName(name){
	return name
	.toUpperCase()
	.replace(/\s/g, '')
	.replace(/^([^\d])(\d)$/, '$10$2')
}


function actualizeDate(target, key, str){
	const date = valueParser(key, str)
	if(date){
		target[key] = date
	}
}
function valueParser(type, str){
	const info = parser[type]
	for(var i in info.options) {
		const option = info.options[i]
		const allow = [option.allow || []].flat()
		const disAllow = [option.disAllow || []].flat()
		const getValue = (typeof option.value == 'function') ? option.value : () => option.value
		if(disAllow.find(regExp => str.match(regExp))) continue
		
		if((typeof option.value == 'string') && str.match(option.value)) return option.value
		for(var j in allow){
			const match = str.match(allow[j])
			if(match) return getValue(match)
		}
	}
	return info.default
}

async function getId(type, obj){
	const name = obj.name
	idCache[type] = idCache[type] ?? {}
	var _id = idCache[type][name]
	if(_id) return _id
	_id = uuid(type)
	docs.push({
		_id,
		type,
		...obj
	})
	idCache[type][name] = _id
	//console.log(`Created ${type} ${name}`)
	return _id
}


async function importInspections(json){
	
	for(var y=0; y<json.length; y++){
		const line = json[y]
		await importLine(line,)
	}
	
	
}
function uuid(prefix, length=10) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix ? prefix+'-' : ''
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

function dateToId(date){
	return date.getFullYear() + ('0' + (date.getMonth()+1)).slice(-2) + ('0' + date.getDate()).slice(-2)
}
async function importLine(line){
	const entries = Object.entries(line)
	entries.forEach((entry, idx) => {
		const [dateStr, note] = entry
		if(note.search('//')>0){
			const doubleNote = note.split('//')
			const date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
			const newDate = incDate(date, -1).toLocaleDateString()
			console.log('newDate', newDate, dateStr)
			entries[idx] = [newDate, doubleNote[0]]
			entries.splice(idx+1,0,[dateStr, '# Geteilter Doppeleintrag # '+doubleNote[1]])
			console.log('Split double entry', entries.slice(idx, idx+2))
		}
	})
	const inspections = []
	const summaries = []
	const header = entries.shift()
	const boxName = fixBoxName(header[1])
	if(oneBoxOnly && oneBoxOnly != boxName) return
	const box_id = await getId('box', {name: boxName})
	let occupancy = 0
	var lastInspection = {}
	var _hiddenLastInspection = {} // for accessing the lastInspection after it got cleared
	for(var x in entries){
		const [dateStr, note] = entries[x]
		if(note == 'NK' || note.match(/,\s*NK\s*,/)) continue
		const date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
		const scope = valueParser('scope', note)
		// if there is no state noted, but there was one before, fallback
		var state = valueParser('state', note)
		if(state == 'STATE_EGGS' && lastInspection.state == 'STATE_BREEDING'){
			state = 'STATE_BREEDING'
		}
		if(
			isCatastrophic({state}) && 
			isOccupied(lastInspection) &&
			(lastInspection.state != 'STATE_SUCCESS')
		) {
			state = 'STATE_FAILURE'
		}
		
		if(
			state == 'STATE_ABANDONED' &&
			!isOccupied(lastInspection)
		){
			state = 'STATE_EMPTY'
		}
		
		if(
			(lastInspection.state == 'STATE_SUCCESS') ||
			(isFinished(lastInspection) && !isFinished({state})) // allow catastrophe to continue
		){
			_hiddenLastInspection = lastInspection
			lastInspection = {}
		}
		if(state == 'STATE_EMPTY' && lastInspection.state == 'STATE_NESTLINGS'){
			// nobody at home but nothing happened
			state = 'STATE_SUCCESS'
		}
		state = state || lastInspection.state
		const inspection = {
			...lastInspection,
			_id: `inspection-${uuid()}`,
			type: 'inspection',
			box_id,
			date,
			note,
			scope,
			state
		}
		delete inspection.perpetrator_id 
		inspections.push(inspection)
		if(scope == 'SCOPE_OUTSIDE' || note.match(/UV/)) continue
		if(state == 'STATE_EMPTY') delete inspection.species_id
		
		if(inPreparation(inspection)) delete inspection.occupancy
		else if(isOccupied(inspection) && !isOccupied(lastInspection))	{
			inspection.occupancy = ++occupancy
		}
		
		const perpetratorName = valueParser('perpetrator', note)
		const reasonForLoss = valueParser('reasonForLoss', note)
		if(state == 'STATE_OCCUPIED' || state == 'STATE_FAILURE'){
			if(perpetratorName) {
				inspection.perpetrator_id = await getId('perpetrator', {name: perpetratorName})
			}
			if(isOccupied(lastInspection)) {
				inspection.reasonForLoss = reasonForLoss
			}
		}
		if(
			reasonForLoss == 'PREDATION' && 
			_hiddenLastInspection.state == 'STATE_FAILURE' && 
			perpetratorName &&
			!_hiddenLastInspection.perpetrator_id
		){
			_hiddenLastInspection.perpetrator_id = await getId('perpetrator', {name: perpetratorName})
		}
		
		if(inspection.occupancy){
			inspection.eggs = valueParser('eggs', note)
			inspection.nestlings = valueParser('nestlings', note)
			if(
				((state == 'STATE_EGGS') || (state == 'STATE_BREEDING')) &&
				!inspection.eggs &&
				lastInspection.eggs
			){
				inspection.eggs = lastInspection.eggs
			}
			if(
				((state == 'STATE_NESTLINGS') || (state == 'STATE_SUCCESS')) &&
				!inspection.nestlings && 
				lastInspection.nestlings
			){
				inspection.nestlings = lastInspection.nestlings
			}
			if(
				(state == 'STATE_NESTLINGS') &&
				!inspection.nestlings && 
				lastInspection.eggs
			){
				inspection.nestlings = lastInspection.eggs - (inspection.eggs || 0)
			}
			inspection.clutchSize = Math.max(
				inspection.eggs || 0,
				inspection.nestlings || 0,
				inspection.clutchSize || 0
			)
		}
		
		// Something like "alle Nestlinge ausgeflogen"
		if(state == 'STATE_SUCCESS' && inspection.nestlings == 0){
			inspection.nestlings = lastInspection.nestlings
		}
		bandingParser(inspection, note)

		if(state != 'STATE_EMPTY') {
			const speciesName = valueParser('speciesName', note)
			if(speciesName) {
				inspection.species_id = await getId('species', {name: speciesName})					
				if(
					lastInspection.species_id && 
					(lastInspection.species_id != inspection.species_id) 
				){
					inspection.takeover = valueParser('takeover', note)
					if(!inspection.takeover){
						console.error('Species changed without explicit takeover', boxName, inspection.date.toLocaleDateString())
					}
					if(isOccupied(inspection)){
						console.error(`Species changed after STATE_EGGS: ${boxName} ${inspection.date.toLocaleDateString()}`)
					}
				}
			}
		}
			
			
		actualizeDate(inspection, 'breedingStart', note)
		actualizeDate(inspection, 'layingStart', note)
		actualizeDate(inspection, 'hatchDate', note)
		if(
			inspection.eggs &&
			!inspection.layingStart
		){
			inspection.layingStart = incDate(inspection.date, -inspection.eggs)
		}
		if(
			state == 'STATE_BREEDING' && 
			!inspection.breedingStart &&
			inspection.layingStart
		){
			inspection.breedingStart = incDate(inspection.layingStart, inspection.clutchSize)
		}
		
		if(inspection.hatchDate){
			inspection.bandingWindowStart = incDate(inspection.hatchDate, bandingStartAge)
			inspection.bandingWindowEnd = incDate(inspection.hatchDate, bandingEndAge)
		}
		if(isFinished(inspection) && isFinished(lastInspection)){
			console.error(`Double entry for state ${state}: ${boxName} ${date.toLocaleDateString()}`)
		}
		if(state == 'STATE_EGGS' && !inspection.eggs) {
			console.error(`STATE_EGG without eggs: ${boxName} ${date.toLocaleDateString()}`, note)
		}
		if(state == 'STATE_NESTLINGS' && !inspection.nestlings) {
			console.error(`STATE_NESTLINGS without nestlings: ${boxName} ${date.toLocaleDateString()}`, note)
		}
		if(state == 'STATE_ABANDONED') console.error(`STATE_ABANDONED: ${boxName} ${date.toLocaleDateString()}`)
		lastInspection = inspection
	}
	docs.push(...inspections)
}
function isFinished(stateholder){
	const state = stateholder?.state
	return (
		state=='STATE_SUCCESS' ||
		state=='STATE_FAILURE' 
		//state=='STATE_ABANDONED' ||
		//state=='STATE_OCCUPIED'
	)
}
function isOccupied(stateholder){
	const state = stateholder?.state
	return (
		state == 'STATE_EGGS' || 
		state == 'STATE_NESTLINGS' ||
		state == 'STATE_BREEDING'
	)
}
function inPreparation(stateholder){
	const state = stateholder?.state
	return (
		state == 'STATE_EMPTY' ||
		state == 'STATE_NEST_BUILDING' ||
		state == 'STATE_NEST_READY'
	)
}

function isCatastrophic(stateholder){
	const state = stateholder?.state
	return state == 'STATE_ABANDONED' || state == 'STATE_OCCUPIED'
}
function bandingParser(target, note){
	['nestlingsBanded', 'femaleBanded', 'maleBanded'].forEach(prop => {
		const parsedValue = valueParser(prop, note)
		if(parsedValue) target[prop] = parsedValue
	})
	if(
		note.match(/ring/) &&
		!target.nestlingsBanded &&
		!target.femaleBanded &&
		!target.maleBanded
	){
		console.error('unknown "ring" match', note)
	}
}

function log(obj, attachments = {}){
	obj = Object.assign(attachments, obj)
	Object.entries(obj).forEach(([key, value]) => {
		if(key.endsWith('_id')) delete obj[key]
	})
	console.log(obj)
}

/*
function sparse(obj){
	Object.entries(obj).forEach((([key, value]) => {
		if(value == null) delete obj[key]
	}))
	return obj
}
*/
function removeIDs(input){
	const output = {}
	Object.keys(input).sort().forEach(key => {
		if(input[key] != null){
			output[key] = key.endsWith('_id') ? 'XXX' : input[key]
		}
	})
	return output
}
