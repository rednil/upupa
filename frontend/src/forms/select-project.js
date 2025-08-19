import { LitElement, html, css } from 'lit'
import './select-item'
import { translate } from '../translator'
import { login, getDB, setDB, uuid } from '../proxy'

export class SelectProject extends LitElement {

  static get properties() {
    return {
			value: { type: String },
			state: { type: String }
    }
  }

  static get styles() {
    return css`
			app-dialog > div {
				display: flex;
				flex-direction: column;
			}
			
    `
  }
	constructor(){
		super()
		this.ensureProject()
		this.progress = {
			push: 0,
			pull: 0
		}
		this.state = 'init'
		this.projectDbReady = false
	}

  render() {
    return html`
			<app-dialog
				id="login-dialog"
				primary="Login"
				secondary="Abbrechen"
				@primary=${this.login}
				discard="primary"
				head="Login"
			>
				<div>
					<label for="username">Username</label>
					<input type="email" id="username">
					<label for="password">Password</label>
					<input id="password" type="password">
				</div>
      </app-dialog>
			<app-dialog
				id="progress-dialog"
				primary="Im Hintergrund"
				secondary="Abbrechen"
				@secondary=${this.cancelSyncCb}
				discard="primary"
				head="Datenbank Synchronisierung"
			>
				<div>
					<label for="pull">Lesen</label>
					<progress id="pull" max="100" value=${this.progress.pull}></progress>
					<label for="push">Schreiben</label>
					<progress id="push" max="100" value=${this.progress.push}></progress>
				</div>
      </app-dialog>
      <select-item class="borderless" autoselect @change=${this.changeCb} type="project"></select-item>
    `
  }
	async ensureProject(){
		//let project_id = localStorage.getItem(PROJECT)
		console.log('ensureProject')
		try{
			let response = await getDB('project').allDocs({include_docs: true})
			console.log('create project', response)
			if(!response.total_rows){
				const writeResponse = await getDB('project').put({
					_id: `project-${uuid()}`,
					name: 'Upupa',
					type: 'project',
					remoteDB: 'upupa'
				})
				console.log('proxy: No projects configured, created "upupa" from scratch')
				//console.log('writeResponse', writeResponse)
				//response = await db.allDocs({include_docs: true})
				
			}
		} catch(error) {
			console.log('select-project error', error)
			this.dispatchEvent(new CustomEvent('error', { 
				detail: error, 
				bubbles: true,
				composed: true
			}))
			return this.setState('error')
		}
		this.projectDbReady = true
		this.requestUpdate()
		/*
		const projects = response.rows
		if(!project_id || !projects.find(project => project._id == project_id)){
			project_id = projects[0]._id
		}
		await this.selectProject(project_id)
		*/
	}
	async changeCb(evt){
		this.value = evt.target.value
		//this.dispatchEvent(new CustomEvent('change'))
		
	}
	shouldUpdate(){
		return this.projectDbReady
	}
	firstUpdated(){
		//super.connectedCallback()
		this.loginDialog = this.shadowRoot.querySelector('#login-dialog')
		this.progressDialog = this.shadowRoot.querySelector('#progress-dialog')
		console.log('loginDialog', this.loginDialog)
	}
	updated(changed){
		if(changed.has('value')) this.prepareDB()
		if(changed.has('state') || changed.has('value')){
			this.dispatchEvent(new CustomEvent('change'))
		}
	}
	async prepareDB(){
		console.log('prepareDB')
		const project = await getDB('project').get(this.value)
		const localDbName = project.remoteDB || project._id
		const remoteDbName = project.remoteDB
		this.sync = setDB(localDbName, remoteDbName)
		if(this.sync){
			this.sync
			.on('complete', () => {
				console.log('sync complete')
				this.setState('ready')
			})
			.on('error', error => {
				console.log('sync error', JSON.stringify(error))
				if(error.status == 401) {
					this.setState('unauthenticated')
				}
			})
			.on('paused', error => {
				if(!error) this.setState('ready')
				console.log('sync paused', error)
			})
			.on('active', () => {
				console.log('sync active')
				this.setState('syncing')
			})
			.on('change', ({change, direction}) => {
				const { docs_read, pending } = change
				this.progress[direction] = docs_read / (docs_read + pending) * 100
				console.log('sync change', this.progress)
				this.requestUpdate()
			})
			.on('denied', error => {
				console.log('sync denied', error)
			})
		}
		
	}
	setState(state){
		switch(state){
			case 'ready':
				this.progressDialog.open = false
				break
			case 'syncing':
				this.progressDialog.open = true
				break
			case 'unauthenticated':
				this.loginDialog.open = true
				break
		}
		this.state = state
	}
	cancelSyncCb(){
		console.log('cancel sync')
		this.sync?.cancel()
		this.progressDialog.open = false
	}
	
	login(){
		console.log('login')
		const username = this.shadowRoot.querySelector('#username').value
		const password = this.shadowRoot.querySelector('#password').value
		login(username, password)
	}
}

customElements.define('select-project', SelectProject)
