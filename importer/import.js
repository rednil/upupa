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
	nestlings: new RegExp(/(\d+).*Nestling/),
	breedingStart: new RegExp(/Bb[^\d]*(\d+).(\d+)/),
	layingStart: new RegExp(/Lb[^\d]*(\d+).(\d+)/),
	hatchDate: new RegExp(/H[^\d]*(\d+).(\d+)/),
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
	{ key: 'EMPTY', match: ['leer'] },
	{ key: 'NEST_BUILDING', match: ['halbfertiges Nest', 'Nestanfang'] },
	{ key: 'NEST_READY', match: ['legebereit'] },
	{ key: 'LAYING', match: ['Ei'] },
	{ key: 'BREEDING', match: ['brütet'] },
	{ key: 'FEEDING', match: ['Nestling'] }
]

function parseGeneric(str, options){
	for(var i in options){
		const {key, match} = options[i]
		if(str.match(key)) return key
		for(var j in match){
			if(str.match(match[j])) return key
		}
	}
}

const year = 2025

const uri = `mongodb://${DATABASE_ROOT_USERNAME}:${DATABASE_ROOT_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}`

const client = new MongoClient(uri)

// Get the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct the full path to the 'data.ods' file
const filePath = path.join(__dirname, 'data/data.ods');

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
	if(match) return new Date(`${year}-${match[2]}-${match[1]}`)
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
		const summary = {
			year,
			box_id,
			occupancy: 0,
			breedingStart: null,
			layingStart: null,
			hatchDate: null,
			species_id: null,
			clutchSize: 0,
			nestlingsBandDate: null,
			motherBandDate: null,
		}
		var name = null
		for(var x in entries){
			const [dateStr, note] = entries[x]
			const date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
			summary.lastInspection = date
			var eggs = 0
			var nestlings = 0
			
			const eggMatch = note.match(regExp.eggs)
			if(eggMatch) {
				eggs = Number(eggMatch[1])
				if(eggs > summary.clutchSize) summary.clutchSize = eggs
			}
			const nestlingsMatch = note.match(regExp.nestlings)
			if(nestlingsMatch) {
				nestlings = Number(nestlingsMatch[1])
				if(nestlings > summary.clutchSize) summary.clutchSize = nestlings
			}
			var state = parseGeneric(note, states)
			if(state != 'EMPTY') {
				var _name = parseGeneric(note, names)
				if(_name){
					if(name && name!=_name){
						console.error(`name conflict ${date.toLocaleDateString()}`, name, entries)
					}
					name = _name
				}
			}
			// if there is no state noted, but there was one before, fallback
			if(!state && summary.state) state = summary.state
			summary.state = state
			const inspection = {
				date,
				note,
				box_id,
				eggs,
				nestlings,
				state
			}
			const _breedingStart = dateParser(note, regExp.breedingStart)
			if(_breedingStart) summary.breedingStart = _breedingStart
			const _layingStart = dateParser(note, regExp.layingStart)
			if(_layingStart) summary.layingStart = _layingStart
			const _hatchDate = dateParser(note, regExp.hatchDate)
			if(_hatchDate) summary.hatchDate = _hatchDate
			await db.collection('inspections').insertOne(inspection)
		}
		if(summary.clutchSize > 0){
			if(!name) console.error(`Nestlings of unknown species`, entries)
			if(summary.occupancy == 0) summary.occupancy = 1
		}
		
		if(name){
			const species = await db.collection('species').findOne({name})
			var species_id
			if(species){
				species_id = species._id
			}
			else{
				const result = await db.collection('species').insertOne({name})
				species_id = result.insertedId
			}
			summary.species_id = species_id
		}
		
		await db.collection('summaries').insertOne(summary)
	}
}


