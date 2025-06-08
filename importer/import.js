import PouchDB from 'pouchdb'
import XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'
import parser from './parser.js'

const bandingStartAge = 7
const bandingEndAge = 12

const {
	API_PROTOCOL,
	API_HOST,
	API_PORT,
	ADMIN_USERNAME,
	ADMIN_PASSWORD
} = process.env

const auth = {
	username: 'admin',
	password: 'admin'
}
var db = new PouchDB('http://localhost:5984/dev', {auth})
const designDocs = await db.allDocs({
	startkey: "_design/",
	endkey: "_design0",
	include_docs: true
})
console.log('designDocs', designDocs)
await db.destroy()
db = new PouchDB('http://localhost:5984/dev', {auth})
db.bulkDocs(designDocs.rows.map(doc => {
	delete doc.doc._rev
	return doc.doc
}))
const oneBoxOnly = process.argv[2]
const dataPath = 'data/2025-05-27.ods'

const idCache = {}


const workbook = getWorkbook()
const docs = []
await importBoxes(XLSX.utils.sheet_to_json(workbook.Sheets.Box_Status))
await importInspections(XLSX.utils.sheet_to_json(workbook.Sheets['Breeding_(25)']))
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
	console.log(`Created ${type} ${name}`)
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
	const inspections = []
	const summaries = []
	const header = entries.shift()
	const boxName = fixBoxName(header[1])
	if(oneBoxOnly && oneBoxOnly != boxName) return
	const box_id = await getId('box', {name: boxName})
	var summary = null
	//let occupancy = 0
	var lastInspection = {}
	for(var x in entries){
		const inspection = {
			type: 'inspection',
			box_id,
		}
		const [dateStr, note] = entries[x]
		if(note == 'NK') continue
		inspection.date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
		inspection._id = `inspection-${box_id}-${dateToId(inspection.date)}`
		inspection.note = note
		inspection.scope = valueParser('scope', note)
		if(inspection.scope == 'INSIDE'){
			// if there is no state noted, but there was one before, fallback
			const state = inspection.state = valueParser('state', note) || lastInspection.state
			if(
				(summary?.state == 'STATE_SUCCESS') ||
				(isFinished(summary) && !isFinished(inspection))){ // allow catastrophe to continue
				summary = null
			}
			if(!summary && isOccupied(inspection)){
				const occupancy = summaries.length + 1
				const year = inspection.date.getFullYear()
				summary = {
					_id: `summary-${year}-${box_id}-${occupancy}`,
					type: 'summary',
					occupancy,
					year,
					box_id,
					clutchSize: 0
				}
				summaries.push(summary)
			}
			inspection.occupancy = summary?.occupancy
			
			if(!state && !note.match(/UV/) && !note.match(/NK/)){
				console.error('No state:', boxName, inspection.date.toLocaleDateString(), note)
			}
			if(state == 'STATE_OCCUPIED' || state == 'STATE_ABANDONED'){
				const perpetratorName = valueParser('perpetrator', note)
				if(perpetratorName) {
					inspection.perpetrator_id = await getId('perpetrator', {name: perpetratorName})
				}
				if(isOccupied(summary)) {
					summary.reasonForLoss = inspection.reasonForLoss = valueParser('reasonForLoss', note)
				}
			}

			inspection.eggs = valueParser('eggs', note)
			inspection.nestlings = valueParser('nestlings', note)
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
						if(isOccupied(summary)){
							console.error(`Species changed after STATE_EGGS: ${boxName} ${inspection.date.toLocaleDateString()}`)
						}
					}
				}
			}
			if(summary) {
				summary.lastInspection = inspection.date
				// Something like "alle Nestlinge ausgeflogen"
				if(state == 'STATE_SUCCESS' && inspection.nestlings == 0){
					inspection.nestlings = summary.nestlings
				}
				// last wins (only if present)
				[
					'state',
					'nestlings',
					'reasonForLoss',
					'perpetrator_id',
					'nestlingsBanded',
					'femaleBanded',
					'maleBanded',
					'species_id'
				]
				.forEach(prop => {
					if(inspection[prop]) summary[prop] = inspection[prop]
				})
				if(isCatastrophic(inspection)) summary.state = 'STATE_FAILURE'
				actualizeDate(summary, 'breedingStart', note)
				actualizeDate(summary, 'layingStart', note)
				actualizeDate(summary, 'hatchDate', note)
				if(
					state == 'STATE_BREEDING' && 
					!summary.breedingStart &&
					summary.layingStart
				){
					summary.breedingStart = incDate(summary.layingStart, summary.clutchSize)
				}
				if(
					inspection.eggs &&
					!summary.layingStart
				){
					summary.layingStart = incDate(inspection.date, -inspection.eggs)
				}
				if(summary.hatchDate){
					//if(!summary.bandingWindowStart){
						summary.bandingWindowStart = incDate(summary.hatchDate, bandingStartAge)
					//}
					//if(!summary.bandingWindowEnd){
						summary.bandingWindowEnd = incDate(summary.hatchDate, bandingEndAge)
					//}
				}
				
				summary.clutchSize = Math.max(summary.clutchSize, inspection.eggs, inspection.nestlings)
			}

			
		}
		inspections.push(sparse(inspection))
		lastInspection = inspection
	}
	/*
	const summaries = await agent.get(`/api/summaries?box_id=${inspection.box_id}`)
	console.log(
		'summaries',
		summaries.data.map(summary => Object.fromEntries(
			Object.entries(summary)
			.filter(([key]) => !(key.endsWith('_id') || key.endsWith('At')))
		))
	)
	*/
	docs.push(...inspections)
	docs.push(...summaries.map(summary => sparse(summary)))
}
function isFinished(stateholder){
	const state = stateholder?.state
	return (
		state=='STATE_SUCCESS' ||
		state=='STATE_FAILURE' ||
		state=='STATE_ABANDONED' ||
		state=='STATE_OCCUPIED'
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
	target.nestlingsBanded = valueParser('nestlingsBanded', note)
	target.femaleBanded = valueParser('femaleBanded', note)
	target.maleBanded = valueParser('maleBanded', note)
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
function sparse(obj){
	Object.keys(obj).forEach(key => {
		if(obj[key] == null) delete obj[key]
	})
	return obj
}
