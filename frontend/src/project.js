export class Project {
	constructor(config){
		this._config = config
		this.localDbName = config.remoteDB || config._id
		this.remoteDbName = config.remoteDB
		this.localDB = new PouchDB(this.localDbName, {adapter: 'indexeddb'})
		this.initialized = false
		if(this.remoteDbName){
			const remoteURL = `${window.location.origin}/api/couch/${this.remoteDbName}`
			this.remoteDB = new PouchDB(remoteURL, {
				skip_setup: true
			})
			this.userDB = new PouchDB(window.location.origin + '/api/couch/_users', {
				skip_setup: true
			})
		}
		console.log('Project created', config)
	}
	static async create(config){
		const project = new Project(config)
		await project.startSync()
		return project
	}

	async startSync(){
		if(this.remoteDB){
			await this.getSession()
			this.syncHandler = this.localDB.sync(this.remoteDB, {
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
	async login(username, password){
		this.loginResponse = await this.remoteDB.login(username, password)
		console.log('loginResponse 1', this.loginResponse)
		await this.startSync()
		return this.loginResponse
	}
	async logout(){
		const response = await remoteDB.logout()
		if(response.ok) {
			console.log('logout response', response, this.syncHandler)
		}
		this.reportError('response-not-ok', response)
	}
}

