import PouchDB from 'pouchdb'
import XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'



const {
	API_PROTOCOL,
	API_HOST,
	API_PORT,
	ADMIN_USERNAME,
	ADMIN_PASSWORD
} = process.env

var db = new PouchDB('http://localhost:5984/dev', {
	auth: {
		username: 'admin',
		password: 'admin'
	},
})

await db.destroy()
db = new PouchDB('http://localhost:5984/dev', {
	auth: {
		username: 'admin',
		password: 'admin'
	},
})
const oneBoxOnly = process.argv[2]
const dataPath = 'data/2025-05-27.ods'
const year = 2025
const bandingStartAge = 7
const bandingEndAge = 12
const idCache = {}
const parseInfo = {
	eggs: {
		options: [
			{ 
				allow: [
					/(\d+)\s*Eier/,
					/\((\d+)\?\)\s*Eier/
				],
				value: match => Number(match[1])
			}
		],
		default: 0
	},
	nestlings: {
		options: [
			{ 
				allow: [
					/(\d+)\s*Nestling/,
					/\((\d+)\?\)\s*Nestling/,
					/Nestlinge\s*\((\d+)\?\)/
				],
				value: match => Number(match[1])
			}
		],
		default: 0
	},
	breedingStart: {
		options: [
			{
				allow: /Bb[^\d]*(\d+).(\d+)/,
				value: dateFormatter
			}
		]
	},
	layingStart: {
		options: [
			{
				allow: [
					/Lb[^\d]*(\d+).(\d+)/,
					/Eiablage[^\d]*(\d+).(\d+)/
				],
				value: dateFormatter
			}
		]
	},
	hatchDate: {
		options: [
			{
				allow: /H[^\d]*(\d+).(\d+)/,
				value: dateFormatter
			}
		]
	},
	nestlingsBandDate: {
		options: [
			{
				allow: /Nestlinge.*ring.[^\d]+(\d+).(\d+)/,
				value: dateFormatter
			}
		]
	},
	nestlingsBanded: {
		options: [
			{
				allow: /(\d+)[^\d]*Nestlinge.*ringt/,
				value: match => Number(match[1])
			}
		]
	},
	femaleBanded: {
		options: [
			{
				allow: ['W beringt', 'beide Altvögel beringt'],
				value: true
			}
		]
	},
	maleBanded: {
		options: [
			{
				allow: 'beide Altvögel beringt',
				value: true
			}
		]
	},
	speciesName: {
		options: [
			{	value: 'Blaumeise', 		allow: ['BM'] 						},
			{ value: 'Kleiber', 			allow: ['Kleiber', 'KL'] 	},
			{ value: 'Kohlmeise', 		allow: ['KM']							},
			{ value: 'Sumpfmeise', 		allow: ['SM']							},
			{ value: 'Wasseramsel', 	allow: ['WA']							},
			{ value: 'Feldsperling', 	allow: []									},
			{ value: 'Tannenmeise', 	allow: ['TM']							}
		]
	},
	state: {
		options: [
			{ value: 'STATE_SUCCESS', allow: ['ausgeflogen']},
			{ 
				value: 'STATE_OCCUPIED',
				allow: [
					'Nest-Okkupation',
					'Siebenschläfer',
					'Nestprädation',
					'Hornisse'
				],
				disAllow: 'Nest-Okkupation BM'
			},
			{ 
				value: 'STATE_ABANDONED',
				allow: [
					'Nest-Okkupation',
					'Prädation',
					'Nestprädation',
					'Altvogel verunglückt',
					'Nest aufgegeben',
					'Brut aufgegeben',
					'Keine Eier mehr auffindbar'
				],
				disAllow: 'Nest-Okkupation BM'
			},
			{ value: 'STATE_NESTLINGS', allow: ['Nestling'] },
			{ value: 'STATE_BREEDING', allow: ['brütet'] },
			{ value: 'STATE_EGGS', allow: ['Ei'], disAllow: ['Eichhörnchen', /[kK]eine Eier/] },
			{ value: 'STATE_NEST_BUILDING', allow: [
				'halbfertiges Nest',
				'Nestanfang',
				'fast fertiges Nest',
				'halb fertiges Nest',
				'Nest, fast fertig',
				'Moos',
				'fast fertigees Nest',
				'NA',
				'Nesteintrag'
			] },
			{ value: 'STATE_NEST_READY', allow: [
				'legebereit',
				'fertiges Nest',
				'fertig vorbereiteter Brutraum'
			] },
			{ value: 'STATE_EMPTY', allow: ['leer'] },
		]
	},
	reasonForLoss: {
		options: [
			{ value: 'TAKEOVER', allow: ['Nest-Okkupation BM'] },
			{ value: 'PREDATION', allow: [
				'Siebenschläfer',
				'Eichhörnchen',
				'Prädation',
				'Keine Eier mehr auffindbar'
			] },
			{ value: 'PARENT_MISSING', allow: [
				'Altvogel verunglückt',
				'Nest aufgegeben',
				'Brut aufgegeben'
			]}
		]
	},
	perpetrator: {
		options: [
			{ value: 'Siebenschläfer' },
			{ value: 'Eichhörnchen' },
			{ value: 'Hornisse' }
		]
	},
	scope: {
		options: [
			{ value: 'OUTSIDE', allow: ['O.K.'], disAllow: /\d+\sNestlinge beringt/ },
		],
		default: 'INSIDE'
	},
	takeover: {
		options: [
			{ value: true, allow: ['Nest-Okkupation BM'] },
		]
	}
}

const workbook = getWorkbook()
await importBoxes(XLSX.utils.sheet_to_json(workbook.Sheets.Box_Status))
await importInspections(XLSX.utils.sheet_to_json(workbook.Sheets['Breeding_(25)']))

function getWorkbook(){
	// Get the directory name using import.meta.url
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	// Construct the full path to the 'data.ods' file
	const filePath = path.join(__dirname, dataPath);
	// Read the .ods file
	return XLSX.readFile(filePath)
}

function uuid() {
	return (new Date().getTime()).toString() + Math.round(Math.random() * 1000000)
}

async function importBoxes(json){
	//console.log(`drop boxes`, (await agent.delete('/api/self/boxes')).status)
	for(var i=0; i<json.length; i++){
		const entry = json[i]
		var name = entry['Nistkastennr.']
		if(!name) continue
		const box = {
			_id: uuid(),
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
function dateFormatter(match){
	const month = ('0' + match[2]).slice(-2)
	const date = ('0' + match[1]).slice(-2)
	const dateStr = `${year}-${month}-${date}T00:00:00Z`
	return new Date(dateStr)
}

function actualizeDate(target, key, str){
	const date = valueParser(key, str)
	if(date) target[key] = date
}
function valueParser(type, str){
	const info = parseInfo[type]
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
	var id = idCache[type][name]
	if(id) return id
	const response = await db.put({
		_id: uuid(),
		type,
		...obj
	})
	if(response && response.ok && response.id){
		console.log(`Created ${type} ${name}`)
		return idCache[type][name] = response.id
	}
	else {
		throw ('Insertion of ${type} ${name} failed', response)
	}
}


async function importInspections(json){
	
	
	for(var y=0; y<json.length; y++){
		const line = json[y]
		await importLine(line)
	}
	
	// parallel not working, species inserted multiple times
	// await Promise.all(json.map(importLine))
}
async function importLine(line){
	const entries = Object.entries(line)
	const header = entries.shift()
	const boxName = fixBoxName(header[1])
	if(oneBoxOnly && oneBoxOnly != boxName) return
	const box_id = await getId('box', {name: boxName})
	var summary = {}
	var inspection = {}
	for(var x in entries){
		inspection = {
			_id: uuid(),
			type: 'inspection',
			box_id
		}
		const [dateStr, note] = entries[x]
		if(note == 'NK') continue
		inspection.date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
		inspection.note = note
		inspection.scope = valueParser('scope', note)
		if(inspection.scope == 'INSIDE'){
			const state = inspection.state = valueParser('state', note)
			// if there is no state noted, but there was one before, fallback
			if(!state && !note.match(/UV/) && !note.match(/NK/)) console.error('No state:', boxName, inspection.date.toLocaleDateString(), note)
			if(state == 'STATE_OCCUPIED' || state == 'STATE_ABANDONED'){
				const perpetratorName = valueParser('perpetrator', note)
				if(perpetratorName) inspection.perpetrator_id = await getId('perpetrator', {name: perpetratorName})
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
			
			
			actualizeDate(inspection, 'breedingStart', note)
			actualizeDate(inspection, 'layingStart', note)
			actualizeDate(inspection, 'hatchDate', note)
			bandingParser(inspection, note)
		}
		//log(sparse(inspection), { _box: boxName})
		try{
			const response = await db.put(sparse(inspection))
		}catch(e){
			console.error(`Failed to insert inspection`, e)
		}
		
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
