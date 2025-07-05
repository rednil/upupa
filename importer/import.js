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


const dataDir = 'data'

const idCache = {}
const boxIdCache = {}
const docs = []
const startYear = 2020
const endYear = 2025
for(var year = startYear; year<=endYear; year++){
	parser.year = year
	const workbook = getWorkbook(year)
	//console.log(Object.keys(workbook.Sheets))
	await importBoxes(XLSX.utils.sheet_to_json(workbook.Sheets.Box_Status))
	await importInspections(XLSX.utils.sheet_to_json(workbook.Sheets['Breeding']))
}
docs.map(doc => console.log(removeIDs(doc)))
await db.bulkDocs(docs)


function getWorkbook(){
	// Get the directory name using import.meta.url
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	// Construct the full path to the 'data.ods' file
	const filePath = path.join(__dirname, dataDir, `${year}.ods`)
	// Read the .ods file
	return XLSX.readFile(filePath, { cellDates: true })
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
		if(oneBoxOnly && oneBoxOnly != name) continue
		const box = {
			type: 'box',
			name: fixBoxName(name),
			site: entry['Standort'],
			lat: entry['Breite'] || entry['Breite_1'],
			lon: entry['Länge'] || entry['Länge_1'],
			note: entry['Zustand'],
		}
		if(entry['Installation']) {
			box.validFrom = new Date(entry['Installation']).toISOString().split('T')[0]
		}
		if(entry['Daten']){
			const architecture = {
				name: valueParser('architecture', entry['Daten']),
				//...parseEntrance(entry['Daten'])
			}
			if(!architecture.name) console.error(parser.year, `Missing parser for architecture "${entry['Daten']}"`)
			box.architecture_id = getId('architecture', architecture)
		}
		if(!box.name || !box.site) continue
		getBoxId(box, true)
		
	}
}
/*
function parseEntrance(str){
	if(!str || str=='') return {}
	let match = str.match(/oval (\d\d)x(\d\d)/)
	if(match) return {
		entranceWidth: Number(match[1]),
		entranceHeight: Number(match[2]),
		entranceCount: 1
	}
	match = str.match(/(\d)x(\c\c)mm/)
	if(match) return {
		entranceWidth: Number(match[2]),
		entranceHeight: Number(match[2]),
		entranceCount: match[1]
	}
	match = str.match(/(\d\d)mm/)
	if(match) return {
		entranceWidth: Number(match[1]),
		entranceHeight: Number(match[1]),
		entranceCount: 1
	}
}
	*/
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
function valueParser(type, str, boxName, date){
	const info = parser[type]
	for(var i in info.options) {
		const option = info.options[i]
		const allow = [option.allow || []].flat()
		const disAllow = [option.disAllow || []].flat()
		const getValue = (typeof option.value == 'function') ? option.value : () => option.value
		if(
			boxName &&
			date &&
			option.boxDates &&
			option.boxDates.find(boxDate => boxDate.box == boxName && boxDate.date == new Date(date).toISOString().split('T')[0])
		) return getValue()
		if(disAllow.find(regExp => str.match(regExp))) continue
		if((typeof option.value == 'string') && str.match(option.value)) return option.value
		for(var j in allow){
			const match = str.match(allow[j])
			if(match) return getValue(match)
		}
	}
	return info.default
}

function getBoxId(box, calledWithConfig=false){
	const newBox = {
		_id: uuid('box'),
		validFrom: `${parser.year}-01-01`,
		type: 'box',
		...box
	}
	const cache = boxIdCache[box.name]
	if(!cache){
		if(!calledWithConfig) console.error(parser.year, `Box ${box.name} inspected, but not configured`)
		boxIdCache[box.name] = [newBox]
		docs.push(newBox)
		return newBox._id
	}
	const existing = cache.slice(-1)[0]
	if(box.note?.match(/Auschuss OKT 2024/)) {
		existing.validUntil=new Date('2024-11-15')
		return existing._id
	}
	if(box.note?.match(/H11 wurde H25 . H11 zerstört 2022/)){
		existing.validUntil=new Date('2022-12-30')
		return existing._id
	}
	if(calledWithConfig && existing.architecture_id && (box.architecture_id != existing.architecture_id)){
		console.error(
			parser.year,
			'Box architecture changed',
			box.name,
			getNameById('architecture',existing.architecture_id),
			'=>',
			getNameById('architecture',box.architecture_id),
		)
	}
	if(
		!calledWithConfig ||
		(
			(existing.lat == box.lat) &&
			(existing.lon == box.lon) &&
			(existing.architecture_id == box.architecture_id)
		)
	){
		if(box.note && (box.note != existing.note)){
			existing.note = (existing.note ? (existing.note + ', ') : '') + box.note
		} 
		return existing._id
	}
	/*
	if(parser.year == 2021){
		existing.lat = box.lat
		existing.lon = box.lon
		if(box.architecture_id) existing.architecture_id = box.architecture_id
		return existing._id
	}
	*/
	
	
	existing.validUntil = `${parser.year-1}-12-31`
	newBox.validFrom = `${parser.year}-01-01`
	console.log(parser.year, `Box ${box.name} has new location, created new entry`, existing, newBox)
	cache.push(newBox)
	docs.push(newBox)
	return newBox._id
}
function getNameById(type, id){
	let name = ''
	Object.entries(idCache[type]).forEach(([key, value])=>{
		if(value == id) name = key 
	})
	return name
}
function getId(type, obj){
	if(!obj.name) console.error(parser.year, 'getId called without name', type, obj)
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
	//console.error(`Created ${type} ${name}`)
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

async function importLine(line){
	const entries = Object.entries(line)
	entries.forEach((entry, idx) => {
		const [dateStr, note] = entry
		if(note.search('//')>0){
			const doubleNote = note.split('//')
			const date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
			const newDate = incDate(date, -1).toLocaleDateString()
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
	const box_id = await getBoxId({name: boxName})
	let occupancy = 0
	var lastInspection = {}
	var _hiddenLastInspection = {} // for accessing the lastInspection after it got cleared
	for(var x in entries){
		const [dateStr, note] = entries[x]
		if(note == 'NK' || note.match(/,\s*NK\s*,/)) continue
		const date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
		if(date == 'Invalid Date'){
			console.error(`Invalid date "${dateStr}"`)
			process.exit()
		}
		const logDate = date.toLocaleDateString()
		if(date.getFullYear() != parser.year){
			console.error(`File vs column head year mismatch: ${parser.year} <=> ${dateStr}`)
			process.exit()
		}
		const scope = valueParser('scope', note)
		// if there is no state noted, but there was one before, fallback
		var state = valueParser('state', note, boxName, date)
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
		if(x == entries.length-1 && state == 'STATE_NESTLINGS') state = 'STATE_SUCCESS'
		if(boxName == 'SF02' && note =='2 Eier ?') state = 'STATE_EMPTY'
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
				inspection.perpetrator_id = getId('perpetrator', {name: perpetratorName})
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
			_hiddenLastInspection.perpetrator_id = getId('perpetrator', {name: perpetratorName})
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
			if(state == 'STATE_SUCCESS' && note.match(/(\d) Nestling[e]* tot/)){
				inspection.nestlings = lastInspection.nestlings - inspection.nestlings
			}
			if(
				((state == 'STATE_NESTLINGS') || (state == 'STATE_SUCCESS')) &&
				!inspection.nestlings && 
				lastInspection.nestlings
			){
				inspection.nestlings = lastInspection.nestlings
			}
			if(
				(state == 'STATE_NESTLINGS' || state == 'STATE_SUCCESS') &&
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
		bandingParser(inspection, note, boxName)

		if(state != 'STATE_EMPTY') {
			const speciesName = valueParser('speciesName', note)
			if(speciesName) {
				inspection.species_id = getId('species', {name: speciesName})					
				if(
					lastInspection.species_id && 
					(lastInspection.species_id != inspection.species_id) 
				){
					inspection.takeover = valueParser('takeover', note)
					if(!inspection.takeover){
						console.error(inspection.date.toLocaleDateString(), 'Species changed without explicit takeover', boxName )
					}
					if(isOccupied(inspection)){
						console.error(inspection.date.toLocaleDateString(), `Species changed after STATE_EGGS: ${boxName}`)
					}
				}
			}
		}
			
			
		actualizeDate(inspection, 'breedingStart', note)
		actualizeDate(inspection, 'layingStart', note)
		actualizeDate(inspection, 'hatchDate', note)
		if(state == 'STATE_NESTLINGS' && !inspection.hatchDate){
			const nestlingsAge = valueParser('nestlingsAge', note)
			if(nestlingsAge!=null){
				inspection.hatchDate = incDate(date, -nestlingsAge)
				console.error(logDate, boxName, 'Calculated hatchDate from nestlingsAge', inspection.hatchDate, note)
			}
			else{
				const nestlingsBandDate = valueParser('nestlingsBandDate', note)
				if(nestlingsBandDate){
					inspection.hatchDate = incDate(nestlingsBandDate, -9)
					console.error(logDate, boxName, 'Deduced hatchDate from nestlingsBandDate', inspection.hatchDate, note)
				}
			}
			if(!inspection.hatchDate){
				let guess = -3
				if(note.match(/Nestlinge [Bb]eringt/)) guess = -7
				inspection.hatchDate = incDate(date, guess)		
				console.error(logDate, boxName, state, `hatchDate missing, guess date ${guess}`, note)
			}
		}
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
			console.error(logDate, `Double entry for state ${state}: ${boxName}`)
		}
		if(state == 'STATE_EGGS' && !inspection.eggs) {
			console.error(logDate, `STATE_EGG without eggs: ${boxName}`, note)
		}
		if(state == 'STATE_NESTLINGS' && !inspection.nestlings) {
			console.error(logDate, `STATE_NESTLINGS without nestlings: ${boxName}`, note)
		}
		if(state == 'STATE_ABANDONED') console.error(logDate, `STATE_ABANDONED: ${boxName}`)
		lastInspection = inspection
		if(isFinished(inspection && !inspection.species_id)){
			console.error(logDate, 'Finished without identification', boxName)
		}
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
function bandingParser(target, note, boxName){
	['nestlingsBanded', 'femaleBanded', 'maleBanded'].forEach(prop => {
		const parsedValue = valueParser(prop, note)
		if(parsedValue) target[prop] = parsedValue
	})
	const date = new Date(target.date).toISOString().split('T')[0]
	if(
		!target.nestlingsBanded && (
			note.match(/NK beringt/) ||
			note.match(/1 Nestling noch beringt/) ||
			note.match(/Nestlinge [Bb]ering/) ||
			note.match(/beringt 3.5/) ||
			note.match(/Nestlinge \+ Altvogel beringt/) ||
			(date == '2022-05-07' && boxName == 'WH2') ||
			(date == '2024-05-06' && boxName == 'OV1') ||
			(date == '2022-05-13' && boxName == 'K11') ||
			(date == '2024-05-06' && boxName == 'K02') 
		)
	) {
		if(target.nestlings) target.nestlingsBanded = target.nestlings
		else console.error(target.date.toLocaleDateString(), '"NK beringt" but no nestlings', boxName, note)
	}
	if(
		note.match(/ring/) &&
		!target.nestlingsBanded &&
		!target.femaleBanded &&
		!target.maleBanded
	){
		console.error(target.date.toLocaleDateString(), 'unknown "ring" match', boxName, note, 'Nestlings:', target.nestlings)
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
