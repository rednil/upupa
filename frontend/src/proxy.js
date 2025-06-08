const db = new PouchDB(window.location.origin + '/api/couch/db', {
		skip_setup: true

})
const typeCache = {}

export class Proxy {

	constructor(component){
		this.component = component
		this.db = db
	}
	async query(view, options = {}) {
		const response = await this.db.query(`upupa/${view}`, options)
		if(options.include_docs) return response.rows.map(view => view.doc)
		return response.rows
	}
	async getByType(type){
		return typeCache[type] || (typeCache[type] = this.query('typename', {
			startkey: [type],
			endkey: [type, {}],
			include_docs: true
		}))
	}
	clearTypeCache(type){
		delete typeCache[type]
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
		if(!item._id) item._id = this.uuid()
		return this.db.put(item)
	}
	
	async fetchMulti(...requests){
		return Promise.all(
			requests.map(request => this.fetch(...request))
		)
	}

	async fetch(collection, ...query){
		try{
			const response = await fetch(url(collection, query))
			this.checkError(response)
			return await response.json()
		}catch(e){
			this.reportError('fetch-exception', e)
		}
	}

	async fetchSingle(collection, ...query){
		const result = await this.fetch(collection, ...query)
		if(!result instanceof Array){
			return this.reportError('data', `request "${url(collection, query)}" did not deliver an array`)
		}
		if(result.length > 1){
			return this.reportError('data', `request "${url(collection, query)}" returned more than one item`)
		}
		if(result.length == 1) return result[0]
	}
	
	async set( collection, item ){
		try{
			const response = await fetch(`/api/${collection}/${item._id || ''}`, {
				method: item._id ? 'PUT' : 'POST',
				headers:{
					'Content-Type':'application/json'
				},
				body: JSON.stringify(item)
			})
			this.checkError(response)
			return await response.json()
		}
		catch(e){
			console.log('e', e)
		}
		
	}
	async delete(collection, item){
		try{
			const response = await fetch(`/api/${collection}`, {
				method: 'DELETE',
				headers:{
					'Content-Type':'application/json'
				},
				body: JSON.stringify(item)
			})
			this.checkError(response)
			return await response.json()
		}
		catch(e){
			console.log('e', e)
		}
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

const url = (collection, query = []) => {
	return `/api/${collection}${query.length?'?':''}${query.join('&')}`
}
