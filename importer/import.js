import axios from 'axios'
import XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'
import  {CookieJar} from 'tough-cookie'
import { HttpCookieAgent }  from 'http-cookie-agent/http'
//import { HttpsCookieAgent }  from 'http-cookie-agent/https'
const cookieJar = new CookieJar()
// Create an HTTP agent that uses the cookie jar
// If your backend is HTTPS, use HttpsCookieAgent instead
const httpAgent = new HttpCookieAgent({
  cookies: {
    jar: cookieJar,
  },
});
const agent = axios.create({
  baseURL: 'http://localhost:3000', 
  withCredentials: true, 
  httpAgent: httpAgent
})

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
					/\((\d+)\?\)\s*Nestling/
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
				value: 'STATE_FAILURE',
				allow: [
					'Nest-Okkupation',
					'Prädation',
					'Nestprädation',
					'Altvogel verunglückt'
				]
			},
			{ value: 'STATE_NESTLINGS', allow: ['Nestling'] },
			{ value: 'STATE_BREEDING', allow: ['brütet'] },
			{ value: 'STATE_EGGS', allow: ['Ei'], disAllow: ['Eichhörnchen', 'Keine Eier'] },
			{ value: 'STATE_NEST_BUILDING', allow: ['halbfertiges Nest', 'Nestanfang'] },
			{ value: 'STATE_NEST_READY', allow: ['legebereit'] },
			{ value: 'STATE_EMPTY', allow: ['leer'] },
		]
	}
}

const workbook = getWorkbook()
await login('admin', 'admin')
//await importBoxes(XLSX.utils.sheet_to_json(workbook.Sheets.Box_Status))
await importInspections(XLSX.utils.sheet_to_json(workbook.Sheets['Breeding_(25)']))

async function login(username, password) {
	const loginResponse = await agent.post('/api/auth/login', { username, password });
	console.log('Login successful:', loginResponse.data);
}
async function logout(){
	const logoutResponse = await agent.delete('/api/auth/login');
	console.log('Logout successful:', logoutResponse.data)
}
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
	console.log(`drop ${coll}`, (await agent.delete('/api/self/boxes')).status)
	for(var i=0; i<json.length; i++){
		const entry = json[i]
		var name = entry['Nistkastennr.']
		if(!name) continue
		const box = {
			name: fixBoxName(name),
			site: entry['Standort'],
			lat: entry['Breite'] || entry['Breite_1'],
			lon: entry['Länge'] || entry['Länge_1']
		}
		if(!box.name || !box.site) continue
		const response = await agent.post('/api/boxes', box);
    console.log('Inserted Box', box.name, response.status, response.data.insertedId)
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
		for(var j in allow){
			const match = str.match(allow[j])
			if(match) return getValue(match)
		}
	}
	return info.default
}

async function getId(coll, name){
	idCache[coll] = idCache[coll] ?? {}
	var id = idCache[coll][name]
	if(id) return id
	var response = await agent.get(`/api/${coll}?name=${name}`)
	if(response && response.status == 200 && response.data.length){
		if(response.data.length>1) console.error(`More than one ${coll} with name ${name}`)
		id = response.data[0]._id
	}
	else {
		response = await agent.post(`/api/${coll}`, {name})
		if(response && response.status == 200 && response.data.insertedId){
			console.log(`Added formerly unknown "${name}" into collectioin "${coll}"`)
			id = response.data.insertedId
		}
		else {
			return console.error('Insertion of ${name} into ${coll} failed', response.status)
		}
	}
	return idCache[coll][name] = id
}


async function importInspections(json){
	await Promise.all(
		[
			'species',
			'inspections',
			'summaries'
		]
		.map(async coll => {
			console.log(`drop ${coll}`, (await agent.delete(`/api/self/${coll}`)).status)
		})
	)
	//for(var y=0; y<1; y++){
	for(var y=0; y<json.length; y++){
		const line = json[y]
		const entries = Object.entries(line)
		const header = entries.shift()
		const boxName = fixBoxName(header[1])
		const box_id = await getId('boxes', boxName)
		var summary = {}
		var inspection = {}
		for(var x in entries){
			inspection = {
				box_id
			}
			const [dateStr, note] = entries[x]
			inspection.date = new Date(dateStr.replace(/(.*)\.(.*)\.(.*)/, '$3-$2-$1'))
			inspection.note = note
			inspection.type = (note.search('O.K.')>=0) ? 'OUTSIDE' : 'INSIDE'
			if(inspection.type == 'INSIDE'){
				inspection.state = valueParser('state', note)
				// if there is no state noted, but there was one before, fallback
				if(!inspection.state && summary.state) inspection.state = summary.state
				summary.state = inspection.state
				if(inspection.state == 'STATE_FAILURE'){
					if(note.search('Siebenschläfer')>=0) {
						inspection.reasonForLoss = 'PREDATION'
						inspection.predator = 'Siebenschläfer'
					}
					if(note.search('Eichhörnchen')>=0) {
						inspection.reasonForLoss = 'PREDATION'
						inspection.predator = 'Eichhörnchen'
					}
					else if(note.search('Nest-Okkupation') >= 0) {
						inspection.reasonForLoss = 'NEST_OCCUPATION'
					}
				}

				inspection.eggs = valueParser('eggs', note)
				inspection.nestlings = valueParser('nestlings', note)
				
				if(inspection.state != 'STATE_EMPTY') {
					const speciesName = valueParser('speciesName', note)
					if(speciesName) {
						inspection.species_id = await getId('species', speciesName)
						
						if(summary.species_id && summary.species_id != inspection.species_id){
							console.error(`Different species without occupation: ${boxName} ${inspection.date.toLocaleDateString()}`, entries)
						}
						summary.species_id = inspection.species_id
					}
				}
				
				actualizeDate(inspection, 'breedingStart', note)
				actualizeDate(inspection, 'layingStart', note)
				actualizeDate(inspection, 'hatchDate', note)
				bandingParser(inspection, note)
			}
			log(sparse(inspection), { _box: boxName})
			try{
				await agent.post('/api/inspections', sparse(inspection))
			}catch(e){
				console.error(`Failed to insert inspection`, inspection)
			}
		}
	}
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
