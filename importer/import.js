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

const eggRegExp = new RegExp(/(\d+)\s*Eier/)

const names = [
	{ key: 'Blaumeise', match: ['BM'] },
	{ key: 'Kleiber', match: ['Kleiber', 'KL'] },
	{ key: 'Kohlmeise', match: ['KM'] },
	{ key: 'Sumpfmeise', match: ['SM'] },
	{ key: 'Wasseramsel', match: ['WA']}
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
		for(var j in match){
			if(str.match(match[j]) || str.match(key)) return key
		}
	}
}

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

async function importInspections(json){
	db.collection('inspections').drop()
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
		var nameDefault = null
		var hasNestlings = false
		for(var x in entries){
			const [dateStr, note] = entries[x]
			const date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
			const inspection = {
				date,
				note,
				box_id,
			}
			const eggMatch = note.match(eggRegExp)
			if(eggMatch) inspection.eggs = Number(eggMatch[1])
			const nestlingsMatch = note.match(/(\d+)\s*Nestling/)
			if(nestlingsMatch) {
				inspection.nestlings = Number(nestlingsMatch[1])
				hasNestlings = true
			}
			inspection.state = parseGeneric(note, states)
			if(inspection.state != 'EMPTY') {
				var name = parseGeneric(note, names)
				if(name){
					if(nameDefault && nameDefault!=name){
						console.error(`name conflict ${date.toLocaleDateString()}`, nameDefault, entries)
					}
					nameDefault = name
				}
				else if(nameDefault){
					console.log(`No name found, but formerly noted as ${nameDefault}`)
					name = nameDefault
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
					inspection.species_id = species_id
				}
			}
			await db.collection('inspections').insertOne(inspection)
		}
		if(hasNestlings && !nameDefault) {
			console.error(`Nestlings of unknown species`, entries)
		}
	}
}


