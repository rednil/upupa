import PouchDB from 'pouchdb'
import XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'
import parser from './parser.js'

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


function actualizeDate(inspections, target, key, str){
	const date = valueParser(key, str)
	if(date){
		target[key] = date
		inspections.forEach(inspection => delete inspection[key])
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
	_id = uuid()
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
function uuid(length=10) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function dateToId(date){
	return date.getFullYear() + ('0' + (date.getMonth()+1)).slice(-2) + ('0' + date.getDate()).slice(-2)
}
async function importLine(line){
	const entries = Object.entries(line)
	const inspections = []
	const header = entries.shift()
	const boxName = fixBoxName(header[1])
	if(oneBoxOnly && oneBoxOnly != boxName) return
	const box_id = await getId('box', {name: boxName})
	var summary = {	}
	let occupancy = 0
	var inspection = {}
	for(var x in entries){
		inspection = {
			//_id: uuid(),
			type: 'inspection',
			box_id,
		}
		const [dateStr, note] = entries[x]
		if(note == 'NK') continue
		inspection.date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
		//inspection._id = uuid({msecs: inspection.date.getTime()})
		inspection._id = dateToId(inspection.date) + '-' + box_id
		inspection.note = note
		inspection.scope = valueParser('scope', note)
		if(inspection.scope == 'INSIDE'){
			const state = inspection.state = valueParser('state', note)
			if(isFinished(summary) && !isFinished(inspection)){
				delete summary.occupancy
			}
			if(isOccupied(inspection) && !summary.occupancy){
				summary.occupancy = inspection.occupancy = ++occupancy
			}
			inspection.occupancy = summary.occupancy
			// if there is no state noted, but there was one before, fallback
			if(!state && !note.match(/UV/) && !note.match(/NK/)){
				console.error('No state:', boxName, inspection.date.toLocaleDateString(), note)
			}
			if(state == 'STATE_OCCUPIED' || state == 'STATE_ABANDONED'){
				const perpetratorName = valueParser('perpetrator', note)
				if(perpetratorName) {
					inspection.perpetrator_id = await getId('perpetrator', {name: perpetratorName})
				}
				if(isOccupied(summary)) {
					inspection.reasonForLoss = valueParser('reasonForLoss', note)
				}
			}
			
			if(!state && summary.state) inspection.state = summary.state
			summary.state = state
			
			inspection.eggs = valueParser('eggs', note)
			inspection.nestlings = valueParser('nestlings', note)

			// Something like "alle Nestlinge ausgeflogen"
			if(state == 'STATE_SUCCESS' && inspection.nestlings == 0){
				inspection.nestlings = summary.nestlings
			}
			summary.nestlings = inspection.nestlings

			if(state != 'STATE_EMPTY') {
				const speciesName = valueParser('speciesName', note)
				if(speciesName) {
					inspection.species_id = await getId('species', {name: speciesName})
					
					if(
						summary.species_id && 
						(summary.species_id != inspection.species_id) 
					){
						inspection.takeover = valueParser('takeover', note)
						if(!inspection.takeover){
							console.error('Species changed without explicit takeover', boxName, inspection.date.toLocaleDateString())
						}
						if(isOccupied(summary)){
							console.error(`Species changed after STATE_EGGS: ${boxName} ${inspection.date.toLocaleDateString()}`)
						}
					}
					summary.species_id = inspection.species_id
				}
			}
			
			
			actualizeDate(inspections, inspection, 'breedingStart', note)
			actualizeDate(inspections, inspection, 'layingStart', note)
			actualizeDate(inspections, inspection, 'hatchDate', note)
			bandingParser(inspection, note)
		}
		inspections.push(sparse(inspection))
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
}
function isFinished({state}){
	return (
		state=='STATE_SUCCESS' ||
		state=='STATE_FAILURE' ||
		state=='STATE_ABANDONED' ||
		state=='STATE_OCCUPIED'
	)
}
function isOccupied({state}){
	return (
		state == 'STATE_EGGS' || 
		state == 'STATE_NESTLINGS' ||
		state == 'STATE_BREEDING'
	)
}
function bandingParser(inspection, note){
	inspection.nestlingsBanded = valueParser('nestlingsBanded', note)
	inspection.femaleBanded = valueParser('femaleBanded', note)
	inspection.maleBanded = valueParser('maleBanded', note)
	if(
		note.match(/ring/) &&
		!inspection.nestlingsBanded &&
		!inspection.femaleBanded &&
		!inspection.maleBanded
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
