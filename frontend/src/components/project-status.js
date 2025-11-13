import { LitElement, html, css } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import { mcp } from '../mcp'
import { translate } from '../translator'
import { sync_disabled, sync_problem, sync, published_with_changes, cloud_off } from '../icons'

export const 
	STATE_INIT = 'STATE_INIT',
	STATE_READY = 'STATE_READY',
	STATE_ERROR = 'STATE_ERROR',
	STATE_UNAUTHENTICATED = 'STATE_UNAUTHENTICATED',
	STATE_SYNCING = 'STATE_SYNCING'

const stateIcon = {
	[STATE_READY]: published_with_changes,
	[STATE_SYNCING]: sync,
	[STATE_ERROR]: sync_problem
}

export class ProjectStatus extends LitElement {

  static get properties() {
    return {
			//state: { type: String }
    }
  }

  static get styles() {
    return css`
			:host{
				display: flex;
			}
			svg {
				margin: auto;
				width: 1em;
				height: 1em;
			}
			app-dialog > div {
				display: flex;
				flex-direction: column;
			}
			.error {
				color: red;
			}
    `
  }
	constructor(){
		super()
		this.progress = {
			push: 0,
			pull: 0
		}
		this.state = STATE_INIT
		this.loginError = ''
		this.subscribe()
		window.addEventListener('online', () => {
			this.requestUpdate()
		})
		window.addEventListener('offline', () => {
			this.requestUpdate()
		})
	}

	subscribe(){
		if(mcp.project.syncHandler){
			mcp.project.syncHandler
			.on('complete', () => {
				console.log('sync complete')
				this.setState(STATE_READY)
			})
			.on('error', error => {
				console.log('sync error', JSON.stringify(error))
				if(error.status == 401) {
					this.setState(STATE_UNAUTHENTICATED)
				}
				else{
					this.error = error
					this.setState(STATE_ERROR)
				}
			})
			.on('paused', error => {
				if(!error) this.setState(STATE_READY)
				console.log('sync paused', error)
			})
			.on('active', () => {
				console.log('sync active')
				this.setState(STATE_SYNCING)
			})
			.on('denied', error => {
				console.log('sync denied', error)
				this.setState(STATE_ERROR)
				this.error = error
			})
		}
		else {
			// during constructor, events are not sent (or received by app-shell)
			setTimeout(() => this.setState(STATE_READY))
		}
		this.requestUpdate()
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
					<br>
					<label for="password">Password</label>
					<input id="password" type="password">
					<br>
					<div class="error">${this.loginError}</div>
				</div>
      </app-dialog>
			<app-dialog
				id="error-dialog"
				primary="OK"
				discard="primary"
				head="Synchronisationsfehler"
			>
				<div>
					${JSON.stringify(this.error)}
				</div>
      </app-dialog>
			${unsafeSVG(navigator.onLine ? stateIcon[this.state] : cloud_off)}
    `
  }
	
	firstUpdated(){
		this.loginDialog = this.shadowRoot.querySelector('#login-dialog')
		this.errorDialog = this.shadowRoot.querySelector('#error-dialog')
	}
	
	setState(state){
		switch(state){
			case STATE_UNAUTHENTICATED:
				this.loginDialog.open = true
				break
			case STATE_ERROR:
				this.errorDialog.open = true
				break
		}
		this.state = state
		this.dispatchEvent(new CustomEvent('change'))
		this.requestUpdate()
	}
	
	// this must be the only place where we log in,
	// otherwise we won't realize there is a new syncHandler
	async login(){
		this.loginError = ''
		const username = this.shadowRoot.querySelector('#username').value
		const password = this.shadowRoot.querySelector('#password').value
		try{
			await mcp.project.login(username, password)
			this.subscribe()
		}catch(error){
			if(error.status == 401) {
				this.loginError = error.message
				this.loginDialog.open = true
				this.requestUpdate()
			}
			else {
				this.dispatchEvent(new CustomEvent('error', {
					detail: {
						type: 'exception',
						detail: error
					},
					bubbles: true,
					composed: true 
				}))
			}
		}
	}
}

customElements.define('project-status', ProjectStatus)
