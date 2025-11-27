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
      state: { type: Object },
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
		this.progress = {
			push: 0,
			pull: 0
		}
		this.loginError = ''
		window.addEventListener('online', () => this.requestUpdate())
		window.addEventListener('offline', () => this.requestUpdate())
	}

  render() {
    return html`
			<app-dialog
				.open=${live(this.state.auth == AUTH_UNAUTHENTICATED || this.state.auth == AUTH_ERROR)}
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
				?open=${mcp.state.sync == SYNC_ERROR}
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
		if(mcp.state.auth != AUTH_AUTHENTICATED) return sync_disabled
		return stateIcon[mcp.state.sync] 
	}
	firstUpdated(){
		this.loginDialog = this.shadowRoot.querySelector('#login-dialog')
		this.errorDialog = this.shadowRoot.querySelector('#error-dialog')
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
