import { Project } from "./project"

const PROJECT_ID = 'PROJECT_ID'

class MasterControlProgram {
	constructor(){
		try{
			this._db = new PouchDB('projects',{adapter: 'indexeddb'})
		} catch(error){
			this.error = error
		}
		this.projectID = localStorage.getItem(PROJECT_ID)
		this.init()
	}
	_prepareForChange(){
		this.initComplete = new Promise(resolve => {
			this._readyResolve = resolve
		})
	}
	async init(){
		this._prepareForChange()
		try{
			if(!this.projectID || !this._db.get(this.projectID)){
				let response = await this._db.allDocs()
				//console.log('created project in database', response)
				if(!response.total_rows){
					this.projectID = `project-${this.uuid()}`
					await this._db.put({
						_id: this.projectID,
						name: 'Upupa',
						type: 'project',
						remoteDB: 'upupa'
					})
					console.log('proxy: No projects configured, created "upupa" from scratch')
					//console.log('writeResponse', writeResponse)
					//response = await db.allDocs({include_docs: true})
					
				}
				else {
					this.projectID = response.rows[0].id
				}
			}
			await this.createProject()
		} catch(error) {
			this.error = error
			console.log('MasterControlProgram init error', error)
		}
	}
	
	
	async selectProject(id){
		localStorage.setItem(PROJECT_ID, id)
		location.reload()
		/*
		this._prepareForChange()
		this.projectID = id
		await this.createProject()
		return this.project
		*/
	}
	async createProject(){
		const config = await this._db.get(this.projectID)
		this.project = await Project.create(config)
		this._readyResolve()
	}
	uuid(length = 10){
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
		let result = ''
		const charactersLength = characters.length
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return result
	}
	db(type){
		switch(type){
			case 'user': return this.project.userDB
			case 'project': return this._db
			default: return this.project.localDB
		}
	}
	/*
	async allDocs(options){
		return this._handleResponse(await this.db.allDocs(options), options)
	}
	*/
	async _idStartsWith(str, options){
		options.startkey = str
		options.endkey = str + '\ufff0' 
		if(options.descending) {
			options.startkey = options.endkey
			options.endkey = str
		}
		return await this.project.localDB.allDocs(options)
	}
	async getByType(type){
		switch(type){
			case 'user': return await this._getUsers()
			case 'project': return await this.getProjects()
			default: {
				return (await this._idStartsWith(`${type}-`, {
					include_docs: true
				}))
				.rows.map(row => row.doc)
				.sort((a,b) => ('' + a.name).localeCompare(b.name))
			}
		}
	}
	async getProjects(){
		return (
			await this._db
			.allDocs({include_docs: true})
		)
		.rows.map(row => row.doc)
	}
	async _getUsers(){
		return (
			await this.project.userDB.allDocs({
				startkey: userPrefix,
				endkey: userPrefix + '\ufff0', 
				include_docs: true,
			})
		)
		.rows.map(row => row.doc)
	}
	finalize(item){
		const now = new Date()
		if(!item.type) throw('MISSING_TYPE')
		if(item._id) {
			item.changedAt = now
		}
		else {
			item._id = item.type == 'user'
			? `${userPrefix}:${user.name}`
			: `${item.type}-${this.uuid()}`
			item.createdAt = now
		}
		if(item.type == 'user' && !user.roles) user.roles = []
		item.user_id = this.project.session.userCtx.name
		return item
	}
}



export const mcp = new MasterControlProgram()