import { alert } from "./app/alert"
import { Project } from "./project"
import { uuid } from "./db/uuid"

const PROJECT_ID = 'PROJECT_ID'


class MasterControlProgram extends EventTarget {
	constructor(){
		super()
		try{
			this._db = new PouchDB('projects',{adapter: 'indexeddb'})
			setTimeout(this.check.bind(this), 3000)
		} catch(error){
			this.reportError(error)
		}
		this.projectID = localStorage.getItem(PROJECT_ID)
		this.init()
		
	}
	
	async check(){
		// sometimes on android, the indexeddb becomes unresponsive, i.e. asynchronous
		// requests never return without any exceptions being thrown.
		if(!this.projectID) {
			await alert('Die Browser-Datenbank ("indexeddb") ist nicht mehr ansprechbar. Bitte den Browser schließen und neu öffnen.')
		}
	}
	
	async init(){
		try{
			if(!this.projectID || !(await this._db.get(this.projectID))){
				let response = await this._db.allDocs()
				if(!response.total_rows){
					this.projectID = `project-${uuid()}`
					await this._db.put({
						_id: this.projectID,
						name: 'Upupa',
						type: 'project',
						remoteDB: 'upupa'
					})
					console.log('proxy: No projects configured, created "upupa" from scratch')
				}
				else {
					this.projectID = response.rows[0].id
				}
			}
			this._initProject(this.projectID)
		} catch(error) {
			this.reportError(error)
		}
	}
	
	reportError(msg){
		this.error = `[MCP] ${msg}`
	}

	async selectProject(id){
		localStorage.setItem(PROJECT_ID, id)
		this.projectID = id
		//location.reload()
		return this._initProject(id)
	}
	
	async _initProject(id){
		const config = await this._db.get(id)
		this.project = new Project(config)
		this.dispatchEvent(new Event('projectChange'))
		return this.project
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
	
}



export const mcp = new MasterControlProgram()