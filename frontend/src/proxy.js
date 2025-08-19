
/*
let remoteDB = new PouchDB(window.location.origin + '/api/couch/db', {
		skip_setup: true
})
		let localDB = new PouchDB('local')
localDB.info().then(function (info) {
  console.log('db', info);
})

localDB.sync(remoteDB, {live: true}).on('complete', function () {
  console.log('replication done')
}).on('error', function (err) {
  console.log('replication error', err)
}).on('change', function(change) {
	console.log('replication change', change)
})


localDB.changes({since: 'now', live: true})
.on('change', change => {
	console.log('live feed change', change)
})
.on('error', err => {
	console.log('live change feed error', err)
})
*/

let localDB, remoteDB, projectDB, userDB

userDB = new PouchDB(window.location.origin + '/api/couch/_users', {
	skip_setup: true
})
const PROJECT = 'SETTINGS.PROJECT'
try{
	projectDB = new PouchDB('projects',{adapter: 'indexeddb'})
} catch(error){
	projectDB = error
}

let userCtx = null
const userPrefix = 'org.couchdb.user'
const typeCache = {}

export function getDB(type){
	switch(type){
		case 'user': return userDB
		case 'project': return projectDB
		default: return localDB
	}
}
export function getDatabases(){
	return {
		remote: remoteDB,
		local: localDB,
		project: projectDB,
		user: userDB
	}
}

export function setDB(localDbName, remoteDbName){
	localDB = new PouchDB(localDbName,{adapter: 'indexeddb'})
	if(remoteDbName){
		const remoteURL = `${window.location.origin}/api/couch/${remoteDbName}`
		remoteDB = new PouchDB(remoteURL, {
			skip_setup: true
		})
		return localDB.sync(remoteDB, {
			live: true,
			retry: true
		})
		
	}
}
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
		this.dbUrl = window.location.origin + '/api/couch/db'
		this.projectDB = projectDB
	}
	get db(){
		return localDB
	}
	get userCtx(){
		return userCtx
	}
	
	
	async requestUserInfo(){
    try{
			const session = await remoteDB.getSession()
			if(session.userCtx.name == null){
				return this._finishLogout()
			}
			userCtx = session.userCtx
			if(window.location.hash == '#/login') window.location.hash = ''
		}catch(e){
			this._finishLogout()
			console.log('requestUserInfo error', e)
      this.reportError('exception', e)
		}
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
		if(type=='project') return this._handleResponse(await this.projectDB.allDocs({include_docs: true}), {include_docs: true})
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
	async login(username, password){
		try{
			userCtx = await this.db.login(username, password)
			window.location.hash = ""
		}catch(e){
			this.reportError('exception', e)
		}
	}
	async logout(){
    const response = await remoteDB.logout()
    if(response.ok) {
      console.log('logout response', response)
    }
    this.reportError('response-not-ok', response)
  }
  _finishLogout(){
    userCtx = null
    window.location.hash = "#/login"
  }
}

