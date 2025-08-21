import { pm } from "./projectManager"

let localDB, remoteDB, userDB

/*

localDB.changes({since: 'now', live: true})
.on('change', change => {
	console.log('live feed change', change)
})
.on('error', err => {
	console.log('live change feed error', err)
})
*/

const PROJECT = 'SETTINGS.PROJECT'
const userPrefix = 'org.couchdb.user'
const typeCache = {}

pm.getSelectedProject().then(project => {
	({localDB, remoteDB, userDB} = project)
	console.log('huhu', localDB)
})
export function uuid(length = 10){
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let result = ''
	const charactersLength = characters.length
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength))
	}
	return result
}
export async function login(username, password){
	const loginResponse = await remoteDB.login(username, password)
	console.log('loginResponse', loginResponse)
}
export class Proxy {
	constructor(component){
		this.component = component
		//this.dbUrl = window.location.origin + '/api/couch/db'
		//this.projectDB = projectDB
		
	}
	get db(){
		return localDB
	}
		
	
	async query(view, options = {}) {
		return this._handleResponse(await this.db.query(`upupa/${view}`, options), options)
	}
	async queryReduce(view, options = {}) {
		const response = await this.db.query(`upupa/${view}`, options)
		console.log('queryReduce response', response)
		return response.rows.map(({key, value}) => value)
	}
	async getByType(type){
		if(type=='user') return await this.getUsers()
		if(type=='project') return this._handleResponse(await pm._db.allDocs({include_docs: true}), {include_docs: true})
		return typeCache[type] = typeCache[type] || 
		this.idStartsWith(`${type}-`, {
			include_docs: true
		}).then(docs => docs.sort((a,b) => ('' + a.name).localeCompare(b.name)))
	}
	async getUsers(){
		return (await userDB.allDocs({
			startkey: userPrefix,
			endkey: userPrefix + '\ufff0', 
			include_docs: true,
		})).rows.map(row => row.doc)
	}
	clearTypeCache(type){
		delete typeCache[type]
	}
	async allDocs(options){
		return this._handleResponse(await this.db.allDocs(options), options)
	}
	async idStartsWith(str, options){
		options.startkey = str
		options.endkey = str + '\ufff0' 
		if(options.descending) {
			options.startkey = options.endkey
			options.endkey = str
		}
		return await this.allDocs(options)
	}
	_handleResponse({rows}, options = {}){
		return options.include_docs ? rows.map(view => view.doc) : rows
	}
	uuid(length = 10){
		return uuid(length)
	}
	async put(item){
		console.log('put', item)
		let response
		try{
			if(item.type == 'user') {
				response = await this.putUser(item)
			}
			else{
				this.finalize(item)
				response = await this.getDb(item.type).put(item)
			}
		}
		catch(e){
			console.log('put error', e)
			response = e
			this.reportError('db', e.message)
		}
		
		//this.checkForErrors(response)
		return response
	}
	getDb(type){
		return getDB(type)
	}
	finalize(item){
		const now = new Date()
		if(!item.type) return this.reportError('VALIDATION_ERROR', 'MISSING_TYPE')
		if(item._id) {
			item.changedAt = now
		}
		else {
			item._id = `${item.type}-${this.uuid()}`
			item.createdAt = now
		}
		item.user_id = userCtx.name
		return true
	}
	async bulkDocs(type, items){
		for(let i=0; i<items.length; i++) if(!this.finalize(items[i])) return
		return this.getDb(type).bulkDocs(items)
	}

	async remove(item){
		return (item._id.startsWith(userPrefix) ? userDB : this.db).remove(item)
	}
	
	putUser(user){
		if(!user._id) user._id = `${userPrefix}:${user.name}`
		if(!user.roles) user.roles = []
		return userDB.put(user)
	}
	
	reportError(type, detail){
		this.component.dispatchEvent(new CustomEvent('error', {
			detail: {
				type,
				detail
			},
			bubbles: true,
			composed: true 
		}))
		return false // for validation
	}
	checkForErrors(response = {}){
		if(response.error){
			console.log('checkForErrors ERROR', response)
			this.reportError('db-response', response)
			return true
		}
		return false
	}
	
}

