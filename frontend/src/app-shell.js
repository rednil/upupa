import { LitElement, html, css } from 'lit'

import './app-login'
import './app-users'
import './pages/status'
import './pages/calendar'
import './forms/select-route'
import './pages/overview'
import './forms/button-logout'

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
      error: { type: String },
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
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
				height: 2em;
			}
			.version {
				margin: auto;
			}
			.bottom {
				background-color: red;
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
				path: '#/users',
				menu: true,
				render: () => html`
					<app-users id="page" .self=${this.self}></app-users>
				`
			},
      { 
				path: '#/login',
				render: () => html`
					<app-login id="page" @login=${this.requestUserInfo}></app-login>
				` 
			}
    ]
		this.params = {}
    window.onpopstate = this.navigate.bind(this)
    this.addEventListener('fetch-error', evt => this.handleFetchError(evt.detail))
    this.requestUserInfo()
    this.error = ''
  }
	navigate(){
		this.route = this.routes.find(route => window.location.hash.search(route.path) == 0)
		if(!this.route) {
			console.error(`Unknown route: ${window.location.hash}`)
			return this.navigateDefault()
		}
		this.params = getUrlParams()
	}
  connectedCallback(){
		console.log('__APP_VERSION2__')
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
    const response = await fetch('/api/self')
    switch(response.status){
      case 401:
        this.logout()
        break
      case 200:
        this.self = await response.json()
        if(window.location.hash == '#/login') window.location.hash = ''
				this.error = ""
        break
      default:
        this.logout()
        this.handleFetchError(response)
    }
  }

 
	shouldUpdate(){
		return this.route
	}
  render() {
    return html`
			<div class="top ${this.self?'logged-in':'logged-out'}">
				<select-route .routes=${this.routes} selected=${this.route.path}></select-route>
				<span class="version">__APP_VERSION__</span>
				<div class="user">
					<span>${this.self?.username}</span>
					<button-logout @click=${this.requestLogout}></button-logout>
				</div>
			</div>
			<main>${this.route.render(this.params)}</main>
      <div class="bottom">${this.error}</div>
    `
  }
  async requestLogout(){
		console.log('logout')
    const response = await fetch ('api/auth/login', { method: 'DELETE' })
    if(response?.status==200) {
      this.logout()
    }
    else this.handleFetchError(response)
  }
  logout(){
    this.self = null
    window.location.hash = "#/login"
  }
  async handleFetchError(response){
    let content, jsonError
    try{
      content = await response.json()
    }catch(e){
      jsonError = e
    }
    if(response){
      this.error = `${response.url} responded with ${response.statusText} (${response.status})`
      if(content?.error) this.error += `: ${content.error}`
      console.error(response, content)
    }
    else if(jsonError) {
      console.error(jsonError.message)
    }
  }
}

customElements.define('app-shell', AppShell)
