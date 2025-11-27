export const 
	SYNC_INIT = 'SYNC_INIT',
	SYNC_ACTIVE = 'SYNC_ACTIVE',
	SYNC_COMPLETE = 'SYNC_COMPLETE',
	SYNC_ERROR = 'SYNC_ERROR',

	AUTH_INIT = 'AUTH_INIT',
	AUTH_AUTHENTICATED = 'AUTH_AUTHENTICATED',
	AUTH_UNAUTHENTICATED = 'AUTH_UNAUTHENTICATED',
	AUTH_ERROR = 'AUTH_ERROR',
	AUTH_USERABORT = 'AUTH_USERABORT',

	INIT_INIT = 'INIT_INIT',
	INIT_DONE = 'INIT_DONE',
	INIT_ERROR = 'INIT_ERROR'
	

export class Project extends EventTarget {
	constructor(config){
		super()
		this.config = config
		this.localDbName = config.remoteDB || config._id
		this.remoteDbUrl = config.remoteDB
		this.remoteDbName = this.remoteDbUrl?.split('/').pop()
		this.localDB = new PouchDB(this.localDbName, {adapter: 'indexeddb'})
		if(this.remoteDbUrl){
			this.state = {
				init: INIT_INIT
			}
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
			this.state = {
				sync: SYNC_COMPLETE,
				auth: AUTH_AUTHENTICATED,
				init: INIT_DONE
			}
		}
	}
	
	async startSync(){
		if(this.remoteDB){
			this.setState({
				sync: SYNC_INIT,
				auth: AUTH_INIT
			})

			await this.getSession()

			this.syncHandler = this.localDB.sync(this.remoteDB, {
				live: true,
				retry: true
			})
			this.subscribe()
		}
	}
	setState(state){
		const oldState = this.state
		if(state.sync == SYNC_COMPLETE) state.init = INIT_DONE
		if(state.sync == SYNC_ERROR && this.state.init == INIT_INIT) state.init = INIT_ERROR
		this.state = {
			...this.state,
			...state
		}
		if(JSON.stringify(oldState) != JSON.stringify(this.state)){
			this.dispatchEvent(new Event('change'))
		}
	}
	subscribe(){
		this.syncHandler
		.on('complete', () => {
			console.log('sync complete')
			this.setState({sync: SYNC_COMPLETE})
		})
		.on('error', error => {
			console.log('sync error', JSON.stringify(error))
			if(error.status == 401) {
				this.setState({auth: AUTH_UNAUTHENTICATED})
			}
			else{
				this.error = error
				this.setState({sync: SYNC_ERROR})
			}
		})
		.on('paused', error => {
			console.log('sync paused', error)
			if(!error) this.setState({sync: SYNC_COMPLETE})
		})
		.on('active', () => {
			console.log('sync active')
			this.setState({sync: SYNC_ACTIVE})
		})
		.on('denied', error => {
			console.log('sync denied', error)
			this.setState({
				sync: SYNC_ERROR,
				error
			})
		})
	}
	async getSession(){
    try{
			this.session = await this.remoteDB.getSession()
			this.setState({auth: AUTH_AUTHENTICATED})
			return this.session // this.session.userCtx
		}catch(error){
			this.sessionError = error
			return error
		}
  }
	async login(username, password){
		this.loginResponse = await this.remoteDB.login(username, password)
		await this.startSync()
		return this.loginResponse
	}
	cancelLogin(){
		// in case the user hit "cancel" in the login popup
		this.setState({
			auth: AUTH_USERABORT,
			init: INIT_DONE
		})
	}
	async logout(){
		if(this.state.auth == AUTH_AUTHENTICATED){
			const response = await this.remoteDB.logout()
			if(response.ok) {
				this.setState({
					auth: AUTH_USERABORT
				})
			}
			else{
				this.setState({
					auth: AUTH_ERROR,
					error: JSON.stringify(response)
				})
			}
		}
		
	}
}

