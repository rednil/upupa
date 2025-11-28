import { LitElement, html, css } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import { live } from 'lit/directives/live.js'
import { 
	AUTH_AUTHENTICATED,
	AUTH_ERROR,
	AUTH_UNAUTHENTICATED,
	SYNC_ACTIVE,
	SYNC_COMPLETE,
	SYNC_ERROR
} from '../project'
import { mcp } from '../mcp'
import { translate } from '../translator'
import { sync_disabled, sync_problem, sync, published_with_changes, cloud_off } from '../icons'

const stateIcon = {
	[SYNC_COMPLETE]: published_with_changes,
	[SYNC_ACTIVE]: sync,
	[SYNC_ERROR]: sync_problem
}

export class ProjectStatus extends LitElement {

	static get properties() {
    return {
			project: { type: Object }
    }
  }

  static get styles() {
    return css`
			:host, :host > *{
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
		this.boundUpdate = () => this.requestUpdate()
		this.loginError = ''
		window.addEventListener('online', this.boundUpdate)
		window.addEventListener('offline', this.boundUpdate)
	}

	shouldUpdate(){
		return this.project
	}

  render() {
    return html`
			<app-dialog
				.open=${live(this.project.authState == AUTH_UNAUTHENTICATED || this.project.authState == AUTH_ERROR)}
				id="login-dialog"
				primary="Login"
				secondary="Abbrechen"
				@primary=${this.login}
				discard="secondary"
				@discard=${() => mcp.project.cancelLogin()}
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
				?open=${this.project.syncState == SYNC_ERROR}
				id="error-dialog"
				primary="OK"
				discard="primary"
				head="Synchronisationsfehler"
			>
				<div>
					${JSON.stringify(this.error)}
				</div>
      </app-dialog>
			<div @click=${this.clickCb}>
				${unsafeSVG(this.getIcon())}
			</div>
    `
  }

	getIcon(){
		if(!navigator.onLine) return cloud_off
		if(this.project.authState != AUTH_AUTHENTICATED) return sync_disabled
		return stateIcon[this.project.syncState] 
	}

	firstUpdated(){
		this.loginDialog = this.shadowRoot.querySelector('#login-dialog')
		this.errorDialog = this.shadowRoot.querySelector('#error-dialog')
	}

	updated(changed){
		if(changed.has('project')) {
			this.unsubscribe(changed.get('project'))
			this.subscribe()
		}
	}

	subscribe(){
		this.project.addEventListener('syncStateChange', this.boundUpdate)
		this.project.addEventListener('authStateChange', this.boundUpdate)
	}

	unsubscribe(project){
		if(!project) return
		project.removeEventListener('syncStateChange', this.boundUpdate)
		project.removeEventListener('authStateChange', this.boundUpdate)
	}
	
	clickCb(evt){
		this.loginDialog.open = true
	}

	async login(){
		this.loginError = ''
		const username = this.shadowRoot.querySelector('#username').value
		const password = this.shadowRoot.querySelector('#password').value
		try{
			await mcp.project.login(username, password)
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
