let db = new PouchDB(window.location.origin + '/api/couch/db', {
		skip_setup: true
})
let userDb = new PouchDB(window.location.origin + '/api/couch/_users', {
	skip_setup: true
})
const userPrefix = 'org.couchdb.user'
const typeCache = {}

export class Proxy {
	constructor(component){
		this.component = component
		this.dbUrl = window.location.origin + '/api/couch/db'
	}
	get db(){
		return db
	}
	setDb(url){
		this.dbUrl
		db = new PouchDB(url, {
			skip_setup: true
		})
	}
	
	async query(view, options = {}) {
		return this._handleResponse(await this.db.query(`upupa/${view}`, options), options)
	}
	async queryReduce(view, options = {}) {
		const response = await this.db.query(`upupa/${view}`, options)
		return response.rows.map(({key, value}) => value)
	}
	async getByType(type){
		if(type=='user') return await this.getUsers()
		return typeCache[type] = typeCache[type] || 
		this.idStartsWith(`${type}-`, {
			include_docs: true
		}).then(docs => docs.sort((a,b) => ('' + a.name).localeCompare(b.name)))
	}
	async getUsers(){
		return (await userDb.allDocs({
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
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = ''
		const charactersLength = characters.length
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return result
	}
	async put(item){
		if(item.type == 'user') return this.putUser(item)
		this.addMissingId(item)
		return this.db.put(item)
	}
	addMissingId(item){
		if(!item._id) item._id = `${item.type}-${this.uuid()}`
	}
	async bulkDocs(items){
		items.forEach(item => this.addMissingId(item))
		return this.db.bulkDocs(items)
	}

	async remove(item){
		return (item._id.startsWith(userPrefix) ? userDb : db).remove(item)
	}
	
	putUser(user){
		if(!user._id) user._id = `${userPrefix}:${user.name}`
		if(!user.roles) user.roles = []
		return userDb.put(user)
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
	}
	checkError(response){
		if(response?.status > 400){
			this.reportError('fetch-status', response)
			return true
		}
		return false
	}
}

