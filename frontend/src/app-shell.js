import { LitElement, html, css } from 'lit'
import { mcp } from './mcp.js'
import { STATE_READY, STATE_ERROR, STATE_UNAUTHENTICATED } from './components/project-status.js'
import './components/sync-progress.js'
import './pages/database'
import './pages/status'
import './pages/calendar'
import './forms/select-route'
import './forms/select-year'
import './forms/select-item'
import './pages/overview'
import './forms/button-logout'
import './pages/inspection.js'
import './pages/config.js'
import './components/error-display.js'
import './pages/analysis.js'
import './pages/start'
import { getRoute, getUrlParams, setUrlParams } from './router.js'

export class AppShell extends LitElement {
  static get properties() {
    return {
      error: { type: Object },
			route: { type: Object },
			params: { type: Object }
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
			main {
				display: flex;
				flex: 1;
				width: 100%;
				min-height: 0;
				
			}
      
			.user, .top > * {
				display: flex;
			}
			.user > * {
				margin: auto;
			}
			button-logout {
				display: flex;
				padding-left: 0.5em;
			}
			.top {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
				height: 2em;
			}
			
			.error {
				background-color: red;
				text-align: center;
			}
			
			#sync-progress {
				display: flex;
				flex: 1;
			}
			#sync-progress > div {
				margin: auto
			}
	
			select-route{
				display: flex;
			}
			a {
				text-decoration: none;
				color: black;
			}
			.route-login select-year,
			.route-start select-year,
			.route-analysis select-year {
				display: none;
			}
			.project-status {
				margin: auto;
			}
    `
  }

  constructor() {
    super()
		this.selectedYear = new Date().getFullYear()
		this.firstYear = new Date().getFullYear()
    this.dbReadyOrError = false
		this.params = {}
    window.onpopstate = this.navigate.bind(this)
    this.addEventListener('error', evt => {
			console.log('error', evt.detail)
			this.error = evt.detail
		})
		this.error = ''
  }
	navigate(){
		this.route = getRoute()
		this.params = getUrlParams()
	}
  connectedCallback(){
		super.connectedCallback()
		this._init()
	}

	async _init(){
		await mcp.initComplete
		// navigate triggers an update via params
		this.navigate()
		if(this.params.year) this.selectedYear = Number(this.params.year)
		//this.requestUpdate()
		
	}
	shouldUpdate(){
		return this.route
	}
  updated(){
		setUrlParams({year: this.selectedYear})
		this.params.year = this.selectedYear
		const page = this.shadowRoot.querySelector('#page')
		if(page) Object.assign(page, this.params)
  }

	
  render() {
		return [
			this.renderTopBar(),
			this.renderMain(),
			this.renderBottomBar()
		]
  }
	
	renderTopBar(){
		const userCtx = mcp.project.session?.userCtx
		return html`
			<div class="top ${userCtx?'logged-in':'logged-out'} route-${this.route.path.slice(2)}">
				<select-route selected=${this.route.path}></select-route>
				${this.renderYearSelector()}
				<div>
					<project-status @change=${this.statusChangeCb}></project-status>
					<select-item class="borderless" autoselect @change=${this.projectChangeCb} type="project"></select-item>
			
				</div>
			</div>
    `
	}
	renderYearSelector(){
		return this.dbReadyOrError
		? html`<select-year value=${this.selectedYear} @change=${this.selectYearCb}></select-year>`
		: ''
	}
	renderMain(){
		return this.dbReadyOrError
		? html`<main>${this.route.render(this.params)}</main>`
		: this.renderSyncProgress()
	}
	renderSyncProgress(){
		return html`
			<div id="sync-progress">
				<div>
					<div>Synchronisiere Datenbank ...</div>
					<br>
					<sync-progress .syncHandler=${mcp.project.syncHandler}></sync-progress>
				</div>
			</div>
		`
	}
	renderBottomBar(){
		return html`
			<error-display class="bottom error" .error=${this.error}></error-display>
		`
	}
  statusChangeCb(evt){
		console.log('statusChangeCb', evt.target.state)
		const {state} = evt.target
		if(state == STATE_ERROR || state == STATE_READY){
			if(!this.dbReadyOrError) {
				this.dbReadyOrError = true
				this.requestUpdate()
			}
		}
		if(this.state == STATE_UNAUTHENTICATED && state != STATE_UNAUTHENTICATED) {
			this.requestUpdate()
		}
		this.state = state
	}
  selectYearCb(evt){
		this.selectedYear = Number(evt.target.value)
		this.requestUpdate()
	}
	projectChangeCb(evt){
		console.log('projectChangeCb not implemented')
	}
	
}

customElements.define('app-shell', AppShell)
