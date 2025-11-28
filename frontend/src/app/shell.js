import { LitElement, html, css } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { SYNC_ACTIVE } from '../project.js'
import { mcp } from '../mcp.js'
import '../view/sync-progress.js'
import '../pages/database.js'
import '../pages/status.js'
import '../pages/calendar.js'
import '../forms/select-route.js'
import '../forms/select-year.js'
import '../forms/select-item.js'
import '../pages/overview.js'
import '../pages/inspection.js'
import '../pages/config.js'
import '../pages/analysis.js'
import '../pages/start.js'
import '../view/project-status.js'
import { getRoute, getUrlParams, setUrlParams } from '../router.js'


export class AppShell extends LitElement {
  static get properties() {
    return {
      error: { type: Object },
			route: { type: Object },
			params: { type: Object },
			project: { type: Object }
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
		this.boundUpdate = () => this.requestUpdate()
		this.params = {}
    window.onpopstate = this.navigate.bind(this)
    this.addEventListener('error', evt => {
			console.log('error', evt.detail)
			this.error = evt.detail
		})
		this.error = ''
		mcp.addEventListener('projectChange', () => this.projectChangeCb())
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
	}

	shouldUpdate(){
		return this.route
	}

  updated(changed){
		setUrlParams({year: this.selectedYear})
		this.params.year = this.selectedYear
		const page = this.shadowRoot.querySelector(this.getPageComponent())
		if(page) Object.assign(page, this.params)
		if(changed.has('project')){
			if(changed.get('project')) this.unsubscribe(changed.get('project'))
			if(this.project) this.subscribe()
		}
  }

  render() {
		return [
			this.renderTopBar(),
			this.renderMain(),
			this.renderBottomBar()
		]
  }
	projectChangeCb(){
		this.project = mcp.project
	}
	subscribe(){
		this.project.addEventListener('syncStateChange', this.boundUpdate)
	}
	unsubscribe(project){
		project.removeEventListener('syncStateChange', this.boundUpdate)
	}
	renderTopBar(){
		const userCtx = mcp.project?.session?.userCtx
		return html`
			<div class="top ${userCtx?'logged-in':'logged-out'} route-${this.route.id}">
				<select-route selected=${this.route.id}></select-route>
				${this.renderYearSelector()}
				<div>
					<project-status .project=${mcp.project} .state=${mcp.state}></project-status>
					<select-item 
						class="borderless"
						autoselect
						@change=${this.projectSelectCb}
						type="project"
						value=${mcp.projectID}
					></select-item>
			
				</div>
			</div>
    `
	}

	renderYearSelector(){
		return (mcp.project?.initComplete)
		? html`<select-year value=${this.selectedYear} @change=${this.selectYearCb}></select-year>`
		: ''
	}

	renderMain(){
		if(mcp.project?.initComplete) return html`<main>${this.renderRoute()}</main>`
		if(mcp.project?.syncState == SYNC_ACTIVE) return this.renderSyncProgress()
	}

	getPageComponent(){
		return `page-${this.route.id}`
	}

	renderRoute(){
		const component = this.getPageComponent()
		return unsafeHTML(`<${component}></${component}>`)
	}

	renderSyncProgress(){
		return html`
			<div id="sync-progress">
				<div>
					<div>Synchronisiere Datenbank ...</div>
					<br>
					<sync-progress .project=${this.project}></sync-progress>
				</div>
			</div>
		`
	}

	renderBottomBar(){
		return html`
			<div class="bottom error">${mcp.error || mcp.project?.error || this.error}</div>
		`
	}

  selectYearCb(evt){
		this.selectedYear = Number(evt.target.value)
		this.requestUpdate()
	}

	projectSelectCb(evt){
		mcp.selectProject(evt.target.value)
	}
	
}

customElements.define('app-shell', AppShell)
