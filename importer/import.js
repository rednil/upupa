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
		if(!box) {
			console.error(`Inspection of unknown box: ${boxLabel}`)
			continue
		}
		const inspections = entries.map(([dateStr, note]) => {
			const date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
			const inspection = {
				date,
				note,
				box_id: box._id,
			}
			const eggMatch = note.match(/(\d+)\s*Eier/)
			if(eggMatch) inspection.eggs = Number(eggMatch[1])
			const nestlingsMatch = note.match(/(\d+)\s*Nestlinge/)
			if(nestlingsMatch) inspection.nestlings = Number(nestlingsMatch[1])
			return inspection
		})
		db.collection('inspections').insertMany(inspections)
	}
}
