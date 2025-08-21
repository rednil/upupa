import { Project } from "./project"

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
			//console.log('created project in database', response)
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
				
			}
			else {
				this._selectedProjectID = response.rows[0].id
			}
			await this.createProject()
		} catch(error) {
			this.error = error
			console.log('ProjectManager init error', error)
		}
	}
	/*
	async getProjectDb(){
		await this._ready
		return this._db
	}
	*/
	
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
	async getDB(type){
		switch(type){
			case 'user': return this._selectedProject.userDB
			case 'project': return this._db
			default: return this._selectedProject.localDB
		}
	}
}



export const pm = new ProjectManager()