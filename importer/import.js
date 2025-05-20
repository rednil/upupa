import XLSX from 'xlsx'
import path from 'path'
import { MongoClient } from 'mongodb'
import { fileURLToPath } from 'url'

const {
	DATABASE_HOST,
	DATABASE_PORT,
	DATABASE_ROOT_USERNAME,
	DATABASE_ROOT_PASSWORD,
	DATABASE_NAME,
} = process.env

const regExp = {
	eggs: new RegExp(/(\d+)\s*Eier/),
	nestlings: new RegExp(/(\d+)\s*Nestling/),
	breedingStart: new RegExp(/Bb[^\d]*(\d+).(\d+)/),
	layingStart: new RegExp(/Lb[^\d]*(\d+).(\d+)/),
	hatchDate: new RegExp(/H[^\d]*(\d+).(\d+)/),
	nestlingsBandDate: new RegExp(/Nestlinge.*ring.[^\d]+(\d+).(\d+)/),
	nestlingsBanded: new RegExp(/(\d+)\s*Nestlinge.*ringt/)
}
const names = [
	{ key: 'Blaumeise', match: ['BM'] },
	{ key: 'Kleiber', match: ['Kleiber', 'KL'] },
	{ key: 'Kohlmeise', match: ['KM'] },
	{ key: 'Sumpfmeise', match: ['SM'] },
	{ key: 'Wasseramsel', match: ['WA']},
	{ key: 'Feldsperling', match: []},
	{ key: 'Tannenmeise', match: ['TM']}
]
const states = [
	{ key: 'STATE_SUCCESS', match: ['ausgeflogen']},
	{ key: 'STATE_EMPTY', match: ['leer'] },
	{ key: 'STATE_NEST_BUILDING', match: ['halbfertiges Nest', 'Nestanfang'] },
	{ key: 'STATE_NEST_READY', match: ['legebereit'] },
	{ key: 'STATE_EGGS', match: ['Ei'], noMatch: ['Eichhörnchen', 'Keine Eier'] },
	{ key: 'STATE_BREEDING', match: ['brütet'] },
	{ key: 'STATE_NESTLINGS', match: ['Nestling'] },
	{ key: 'STATE_FAILURE', match: ['Nest-Okkupation', 'Prädation']},
	
]

function parseGeneric(str, options){
	for(var i in options){
		const {key, match, noMatch = []} = options[i]
		var abort = false
		for(var j in noMatch){
			if(str.match(noMatch[j])) {
				abort = true
				break
			}
		}
		if(abort) continue
		if(str.match(key)) return key
		for(var j in match){
			if(str.match(match[j])) return key
		}
	}
}

const year = 2025
const bandingStartAge = 7
const bandingEndAge = 12
const uri = `mongodb://${DATABASE_ROOT_USERNAME}:${DATABASE_ROOT_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}`

const client = new MongoClient(uri)

// Get the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct the full path to the 'data.ods' file
const filePath = path.join(__dirname, 'data/2025.ods');

await client.connect()
const db = client.db(DATABASE_NAME)

// Read the .ods file
const workbook = XLSX.readFile(filePath);


await importBoxes(XLSX.utils.sheet_to_json(workbook.Sheets.Box_Status))
await importInspections(XLSX.utils.sheet_to_json(workbook.Sheets['Breeding_(25)']))
//const firstSheetName = workbook.SheetNames[0]
//const worksheet = workbook.Sheets[firstSheetName]

// Convert the worksheet to JSON format (array of objects)
//const jsonData = XLSX.utils.sheet_to_json(worksheet)

// Log the parsed data
//console.log(firstSheetName)
client.close()


async function importBoxes(json){
	db.collection('boxes').drop()
	for(var i=0; i<json.length; i++){
		const entry = json[i]
		const box = {
			label: entry['Nistkastennr.'],
			site: entry['Standort'],
			lat: entry['Breite'] || entry['Breite_1'],
			lon: entry['Länge'] || entry['Länge_1']
		}
		if(!box.label || !box.site) continue
		await db.collection('boxes').insertOne(box)
	}
}

function dateParser(str, regExp){
	const match = str.match(regExp)
	if(match) {
		const month = ('0' + match[2]).slice(-2)
		const date = ('0' + match[1]).slice(-2)
		const dateStr = `${year}-${month}-${date}T00:00:00Z`
		return new Date(dateStr)
	}
}
function actualizeDate(target, key, str){
	const date = dateParser(str, regExp[key])
	if(date) target[key] = date
}
function eggParser(str){
	const eggMatch = str.match(regExp.eggs)
	return eggMatch ? Number(eggMatch[1]) : 0
}
function nestlingsParser(str){
	const nestlingsMatch = str.match(regExp.nestlings)
	return nestlingsMatch ? Number(nestlingsMatch[1]) : 0
}
function getEmptySummary(box_id, occupancy = 0){
	return {
		year,
		box_id,
		occupancy,
		clutchSize: 0,
		nestlingsBanded: 0
	}
}
async function importInspections(json){
	db.collection('inspections').drop()
	db.collection('summaries').drop()
	for(var y=0; y<json.length; y++){
		const line = json[y]
		const entries = Object.entries(line)
		const header = entries.shift()
		const boxLabel = header[1]
		const box = await db.collection('boxes').findOne({label: boxLabel})
		var box_id 
		if(box) {
			box_id = box._id
		}
		else{
			console.error(`Inspection of unknown box: ${boxLabel}`)
			const result = await db.collection('boxes').insertOne({label: boxLabel})
			box_id = result.insertedId
		}
		var summary = getEmptySummary(box_id)
		for(var x in entries){
			const [dateStr, note] = entries[x]
			const date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
			var state = parseGeneric(note, states)
			// if there is no state noted, but there was one before, fallback
			if(!state && summary.state) state = summary.state
			summary.state = state
			if(state == 'STATE_FAILURE'){
				if(note.search('Siebenschläfer')>=0) {
					summary.reasonForFailure = 'PREDATION'
					summary.predator = 'Siebenschläfer'
				}
				if(note.search('Eichhörnchen')>=0) {
					summary.reasonForFailure = 'PREDATION'
					summary.predator = 'Eichhörnchen'
				}
				else if(note.search('Nest-Okkupation') >= 0) {
					summary.reasonForFailure = 'NEST_OCCUPATION'
				}
				await db.collection('summaries').insertOne(clean(summary))
				var summary = getEmptySummary(box_id, summary.occupancy + 1)
			}

			summary.lastInspection = date
			var eggs = eggParser(note)
			var nestlings = nestlingsParser(note)
			
			if(eggs > summary.clutchSize) summary.clutchSize = eggs
			if(nestlings > summary.clutchSize) summary.clutchSize = nestlings
			var species_id
			
			if(state != 'STATE_EMPTY') {
				species_id = await speciesParser(note)
				if(species_id){
					if(summary.species_id && summary.species_id != species_id){
						console.error(`Different species without occupation: ${date.toLocaleDateString()}`, entries)
					}
					summary.species_id = species_id
					if(summary.occupancy == 0) summary.occupancy = 1
				}
			}
			
			const inspection = {
				date,
				note,
				box_id,
				eggs,
				nestlings,
				state,
				species_id
			}
			actualizeDate(summary, 'breedingStart', note)
			actualizeDate(summary, 'layingStart', note)
			actualizeDate(summary, 'hatchDate', note)

			
	
			const nestlingsBandedMatch = note.match(regExp.nestlingsBanded)
			var knownRingMatch = false
			if(nestlingsBandedMatch) {
				summary.nestlingsBanded = Number(nestlingsBandedMatch[1])
				knownRingMatch = true
			}
			if(note.search('W beringt')>=0) {
				summary.femaleBanded = true
				knownRingMatch = true
			}
			if(note.search("beide Altvögel beringt")>=0){
				summary.femaleBanded = true
				summary.maleBanded = true
				knownRingMatch = true
			}
			if(note.match(/ring/) && !knownRingMatch){
				console.log('unknown "ring" match', note)
			}
			await db.collection('inspections').insertOne(clean(inspection))
		}
		if(summary.clutchSize > 0){
			if(!summary.species_id) console.error(`Nestlings of unknown species`, entries)
		}
		if(summary.hatchDate){
			summary.bandingWindowStart = incDate(summary.hatchDate, bandingStartAge)
			summary.bandingWindowEnd = incDate(summary.hatchDate, bandingEndAge)
		}
		if(summary.occupancy > 0 && summary.state == 'STATE_EMPTY') continue
		await db.collection('summaries').insertOne(clean(summary))
	}
}
function clean(obj){
	Object.keys(obj).forEach(key => {
		if(obj[key] === null) delete obj[key]
	})
	return obj
}
async function speciesParser(str){
	const name = parseGeneric(str, names)
	if(name){
		const species = await db
		.collection('species')
		.findOne({name})
		if(species) return species._id.toString()
		const response = await db
		.collection('species')
		.insertOne({name})
		return response.insertedId.toString()
	}
}
function incDate(date, days){
	const newDate = new Date(date)
	newDate.setDate(date.getDate() + days)
	return newDate
}