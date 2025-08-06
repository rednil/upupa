import { LitElement, html, css } from 'lit'

import { Proxy } from './proxy.js' 
import './pages/login.js'
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
import './app-database'
import { getRoute, getUrlParams, setUrlParams } from './router.js'



export class AppShell extends LitElement {
  static get properties() {
    return {
      error: { type: Object },
			route: { type: Object },
			params: { type: Object },
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
      
			.user, select-year, select-project {
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
			
			select{
				border: 0;
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
		
    `
  }

  constructor() {
    super()
		this.proxy = new Proxy(this)
		this.selectedYear = new Date().getFullYear()
		this.firstYear = new Date().getFullYear()
		
    this.dbReady = false
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
		// verify session status
		await this.proxy.ensureProject()
		//await this.proxy.requestUserInfo()
		// navigate triggers an update via params
		this.navigate()
		if(this.params.year) this.selectedYear = Number(this.params.year)
	}
	
  updated(){
		setUrlParams({year: this.selectedYear})
		this.params.year = this.selectedYear
		const page = this.shadowRoot.querySelector('#page')
		if(page) Object.assign(page, this.params)
  }

	shouldUpdate(){
		return this.route
	}
  render() {
		const userCtx = this.proxy.userCtx
    return html`
			<div class="top ${userCtx?'logged-in':'logged-out'} route-${this.route.path.slice(2)}">
				<select-route selected=${this.route.path}></select-route>
				${this.dbReady ? html`
					<select-year value=${this.selectedYear} @change=${this.selectYearCb}></select-year>
				`: ''}
				<select-item class="borderless" autoselect @change=${this.selectProjectCb} type="project"></select-item>
			</div>
			${this.dbReady ? html`
				<main>${this.route.render(this.params)}</main>
			`: ''}
			<app-database></app-database>
      <error-display class="bottom error" .error=${this.error}></error-display>
    `
  }
  
  selectYearCb(evt){
		this.selectedYear = Number(evt.target.value)
		this.requestUpdate()
	}
	async selectProjectCb(evt){
		this.dbReady = false
		this.project_id = evt.target.value
		console.log('selectProjectCb', this.project_id)
		await this.proxy.selectProject(this.project_id)
		this.dbReady = true
		console.log('dbReady')
		this.requestUpdate()
	}
}

customElements.define('app-shell', AppShell)
