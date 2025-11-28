export const 
	SYNC_INIT = 'SYNC_INIT',
	SYNC_ACTIVE = 'SYNC_ACTIVE',
	SYNC_COMPLETE = 'SYNC_COMPLETE',
	SYNC_ERROR = 'SYNC_ERROR',

	AUTH_INIT = 'AUTH_INIT',
	AUTH_AUTHENTICATED = 'AUTH_AUTHENTICATED',
	AUTH_UNAUTHENTICATED = 'AUTH_UNAUTHENTICATED',
	AUTH_ERROR = 'AUTH_ERROR',
	AUTH_USERABORT = 'AUTH_USERABORT'

export class Project extends EventTarget {
	constructor(config){
		super()
		this.config = config
		this.localDbName = config.remoteDB || config._id
		this.remoteDbUrl = config.remoteDB
		this.remoteDbName = this.remoteDbUrl?.split('/').pop()
		this.localDB = new PouchDB(this.localDbName, {adapter: 'indexeddb'})
		if(this.remoteDbUrl){
			const proxyUrl = `${window.location.origin}/api/db/${this.remoteDbUrl}`
			this.remoteDB = new PouchDB(proxyUrl, {
				skip_setup: true
			})
			this.userDB = new PouchDB(proxyUrl.replace(this.remoteDbName, '_users'), {
				skip_setup: true
			})
			this.startSync()
		}
		else {
			this.initComplete = true
			this.authState = AUTH_AUTHENTICATED
			this.syncState = SYNC_COMPLETE
		}
	}
	
	async startSync(){
		if(this.remoteDB){
			this.setInitComplete(false)
			this.setSyncState(SYNC_INIT)
			this.setAuthState(AUTH_INIT)
			await this.getSession()
			this.syncHandler = this.localDB.sync(this.remoteDB, {
				live: true,
				retry: true
			})
			this.subscribe()
		}
	}
	setInitComplete(initComplete){
		//if(this.initComplete == initComplete) return
		this.initComplete = initComplete
		//this.dispatchEvent(new Event('initCompleteChange'))
	}
	setSyncState(state){
		if(state == this.syncState) return
		this.syncState = state
		if(state == SYNC_COMPLETE || state == SYNC_ERROR){
			this.setInitComplete(true)
		}
		this.dispatchEvent(new Event('syncStateChange'))
	}
	setAuthState(state){
		if(state == this.authState) return
		if(state == AUTH_USERABORT) {
			this.setInitComplete(true)
		}
		this.authState = state
		this.dispatchEvent(new Event('authStateChange'))
	}
	subscribe(){
		this.syncHandler
		.on('complete', () => {
			console.log('sync complete')
			this.setSyncState(SYNC_COMPLETE)
		})
		.on('error', error => {
			console.log('sync error', JSON.stringify(error))
			if(error.status == 401) {
				this.setAuthState(AUTH_UNAUTHENTICATED)
			}
			else{
				this.reportError(error)
				this.setSyncState(SYNC_ERROR)
			}
		})
		.on('paused', error => {
			console.log('sync paused', error)
			if(!error) this.setSyncState(SYNC_COMPLETE)
		})
		.on('active', () => {
			console.log('sync active')
			this.setSyncState(SYNC_ACTIVE)
		})
		.on('denied', error => {
			console.log('sync denied', error)
			this.setSyncState(SYNC_ERROR),
			this.reportError(error)
		})
	}
	reportError(msg){
		this.error = `[PROJECT] ${msg}`
	}
	async getSession(){
    try{
			this.session = await this.remoteDB.getSession()
			this.setAuthState(AUTH_AUTHENTICATED)
			return this.session // this.session.userCtx
		}catch(error){
			this.sessionError = error
			return error
		}
  }
	async login(username, password){
		this.loginResponse = await this.remoteDB.login(username, password)
		if(this.loginResponse.ok) await this.startSync()
		return this.loginResponse
	}
	cancelLogin(){
		// in case the user hit "cancel" in the login popup
		this.setAuthState(AUTH_USERABORT)
	}
	async logout(){
		if(this.authState == AUTH_AUTHENTICATED){
			const response = await this.remoteDB.logout()
			if(response.ok) {
				this.setAuthState(AUTH_USERABORT)
			}
			else{
				this.setAuthState(AUTH_ERROR),
				this.reportError(JSON.stringify(response))
			}
		}
	}
}

