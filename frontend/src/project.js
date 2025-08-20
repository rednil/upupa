class Project {
	constructor(config){
		this._config = config
		this.localDbName = config.remoteDB || config._id
		this.remoteDbName = config.remoteDB
		this.localDB = new PouchDB(localDbName, {adapter: 'indexeddb'})
		this.initialized = false
		if(remoteDbName){
			const remoteURL = `${window.location.origin}/api/couch/${remoteDbName}`
			this.remoteDB = new PouchDB(remoteURL, {
				skip_setup: true
			})
			this.userDB = new PouchDB(window.location.origin + '/api/couch/_users', {
				skip_setup: true
			})
		}
	}
	static async create(config){
		const project = new Project(config)
		await project.init()
		return project
	}
	
	async init(){
		if(this.remoteDB){
			await this.getSession()
			this.sync = this.localDB.sync(this.remoteDB, {
				live: true,
				retry: true
			})
		}
	}
	
	async getSession(){
    try{
			this.session = await this.remoteDB.getSession()
			return this.session // this.session.userCtx
		}catch(error){
			this.sessionError = error
			console.log('getSession exception', error)
			return error
		}
  }
}

class ProjectManager {
	constructor(){
		try{
			this._db = new PouchDB('projects',{adapter: 'indexeddb'})
		} catch(error){
			this.error = error
		}
		this.init()
	}
	_prepareForChange(){
		this._ready = new Promise(resolve => this._readyResolve = resolve)
	}
	async init(){
		this._prepareForChange()
		try{
			let response = await this._db.allDocs()
			console.log('create project', response)
			if(!response.total_rows){
				this._selectedProjectID = `project-${this.uuid()}`
				await this._db.put({
					_id: this._selectedProjectID,
					name: 'Upupa',
					type: 'project',
					remoteDB: 'upupa'
				})
				console.log('proxy: No projects configured, created "upupa" from scratch')
				//console.log('writeResponse', writeResponse)
				//response = await db.allDocs({include_docs: true})
				await this.createProject()
			}
		} catch(error) {
			this.error = error
		}
	}
	async getProjectDb(){
		await this._ready
		return this._db
	}
	
	async getSelectedProjectID(){
		await this._ready
		return this._selectedProjectID
	}
	async selectProject(id){
		this._prepareForChange()
		this._selectedProjectID = id
		await this.createProject()
		return this._selectedProject
	}
	async createProject(){
		const config = await this._db.get(this._selectedProjectID)
		this._selectedProject = await Project.create(config)
		this._readyResolve()
	}
	async getSelectedProject(){
		await this._ready
		return this._selectedProject
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
}



export const pm = new ProjectManager()