import { LitElement, html, css } from 'lit'

import { Proxy } from './proxy.js' 
import './pages/login.js'
import './pages/status'
import './pages/calendar'
import './forms/select-route'
import './pages/overview'
import './forms/button-logout'
import './pages/inspection.js'
import './pages/config.js'
import './components/error-display.js'
import './pages/about'
/* 
Routing can be done via hashed or non-hashed URL paths
See https://blog.bitsrc.io/using-hashed-vs-nonhashed-url-paths-in-single-page-apps-a66234cefc96
When using hashed URLs, 
  * we can use standard <a href=""> links
  * get notified by the onpopstate event
  * do NOT need server side changes in order to serve index.html for every path
When using non-hashed URLs,
  * standard <a href=""> cause a reload of the whole single page application
  * pushState navigation doesn't trigger the onpopstate event (=> we need other means of navigation, e.g. a CustomEvent)
  * the server needs to be changed to serve index.html for every path
*/

// minimalistic router until the lit router works
// see https://github.com/lit/lit/tree/main/packages/labs/router

function getUrlParams(){
	const params = {}
	const { hash } = window.location
	if(hash.indexOf('?') < 0) return params
	const paramStr = window.location.hash.split('?')[1]
	const paramArr = paramStr.split('&')
	paramArr.forEach(param => {
		const [key, value] = param.split('=')
		params[decodeURIComponent(key)] = decodeURIComponent(value)
	})
	return params
}

export class AppShell extends LitElement {
  static get properties() {
    return {
      self: { type: Object },
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
      .logged-out .user, .logged-out select-route {
        display: none;
      }
			.user {
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
		
    `
  }

  constructor() {
    super()
		this.proxy = new Proxy(this)
    this.routes = [
			{
				path: '#/overview',
				default: true,
				menu: true,
				render: () => {
					return html`
					<page-overview id="page"></page-overview>
				`}
			},
			{
				path: '#/status',
				menu: true,
				render: () => html`
					<page-status id="page"></page-status>
				`
			},
			{
				path: '#/calendar',
				menu: true,
				render: () => html`
					<page-calendar id="page"></page-calendar>
				`
			},
			{
				path: '#/inspection',
				menu: true,
				render: () => html`
					<page-inspection id="page"></page-inspection>
				`
			},
			{
				path: '#/config',
				menu: true,
				render: () => html`
					<page-config id="page"></page-config>
				`
			},
			{
				path: '#/about',
				menu: true,
				render: () => html`
					<page-about id="page"></page-about>
				`
			},
      { 
				path: '#/login',
				render: () => html`
					<page-login id="page" @login=${this.requestUserInfo}></page-login>
				` 
			}
    ]
		this.params = {}
    window.onpopstate = this.navigate.bind(this)
    this.addEventListener('error', evt => {
			console.log('error', evt.detail)
			this.error = evt.detail
		})
    this.requestUserInfo()
    this.error = ''
  }
	navigate(){
		this.route = this.routes.find(route => window.location.hash.search(route.path) == 0)
		if(!this.route) {
			if(window.Location.hash) {
				console.error(`Unknown route: ${window.location.hash}`)
			}
			return this.navigateDefault()
		}
		this.params = getUrlParams()
	}
  connectedCallback(){
		super.connectedCallback()
		if(window.location.hash) this.navigate()
		else this.navigateDefault()
	}
	navigateDefault(){
		window.location.hash = this.routes[0].path
	}
  updated(){
		Object.assign(this.shadowRoot.querySelector('#page'), this.params)
  }

  async requestUserInfo(){
    try{
			const session = await this.proxy.db.getSession()
			if(session.userCtx.name == null){
				return this.logout()
			}
			this.self = session.userCtx
			if(window.location.hash == '#/login') window.location.hash = ''
		}catch(e){
			this.logout()
      this.handleFetchError(e)
		}
  }

 
	shouldUpdate(){
		return this.route
	}
  render() {
    return html`
			<div class="top ${this.self?'logged-in':'logged-out'}">
				<select-route .self=${this.self} .routes=${this.routes} selected=${this.route.path}></select-route>
				<div class="user">
					<a href="#/config?collection=users&item_id=${this.self?._id}">${this.self?.username}</a>
					<button-logout @click=${this.requestLogout}></button-logout>
				</div>
			</div>
			<main>${this.route.render(this.params)}</main>
      <error-display class="bottom error" .error=${this.error}></error-display>
    `
  }
  async requestLogout(){
    const response = await this.proxy.db.logout()
    if(response.ok) {
      this.logout()
    }
    else this.error = { type: 'fetch-status', detail: response }
  }
  logout(){
    this.self = null
    window.location.hash = "#/login"
  }
  
}

customElements.define('app-shell', AppShell)
