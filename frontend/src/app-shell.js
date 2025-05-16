import { LitElement, html, css } from 'lit'

import './app-main'
import './app-login'
import './app-menu'
import './app-users'
import './box-list'
import './box-status'
import './box-map'
import './page-calendar'
import './forms/select-route'

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

/*
class Router { 
  constructor (host, routes){
    this.host = host
    this.routes = routes
  }
  outlet(){
		
    const path = window.location.hash
    const route = this.routes.find(route => path.search(route.path) == 0)
		if(!route) return console.error(`Unknown route: ${path}`)
		const params = this.getParams()
		return route.render(params)
  }
	getParams(){
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
}
*/
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
			route: { type: Object }
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
      .logged-out button, .logged-out select {
        display: none;
      }
			.top {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
				height: 2em;
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
				render: (params) => html`
					<box-map box_id=${params.box_id}></box-map>
				`
			},
			{
				path: '#/detail',
				menu: true,
				render: (params) => html`
					<box-status box_id=${params.box_id}></box-status>
				`
			},
			{
				path: '#/calendar',
				menu: true,
				render: () => html`
					<page-calendar></page-calendar>
				`
			},
			{ 
				path: '#/users',
				menu: true,
				render: () => html`
					<app-users .self=${this.self}></app-users>
				`
			},
      { 
				path: '#/login',
				render: () => html`
					<app-login @login=${this.requestUserInfo}></app-login>
				` 
			},
     
			{
				path: '#/boxes',
				render: () => html`
					<box-list></box-list>
				`
			}
    ]
    window.onpopstate = this.navigate.bind(this)
		/*
		window.onpopstate = e => {
			console.log('onpopstate', window.location.hash)
			
      if(this.drawer) this.drawer = false
      else this.requestUpdate()
    }
		*/
    this.addEventListener('fetch-error', evt => this.handleFetchError(evt.detail))
    this.requestUserInfo()
    this.error = ''
  }
	navigate(){
		console.log('navigate')
		this.route = this.routes.find(route => window.location.hash.search(route.path) == 0)
		if(!this.route) {
			console.error(`Unknown route: ${window.location.hash}`)
			return this.navigateDefault()
		}
		this.params = getUrlParams()
		//return route.render(params)
	}
  connectedCallback(){
		super.connectedCallback()
		if(window.location.hash) this.navigate()
		else this.navigateDefault()
	}
	navigateDefault(){
		window.location.hash = this.routes[0].path
	}
  updated(changedProps){
    //if(changedProps.has('error') && this.error) this.snackbar.value.show()
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
				<select disabled>
					<option>2025</option>
				</select>
				${this.self?html`
					<select class="logout">
						<option selected>${this.self?.username}</option>
						<option @click=${this.requestLogout}>Logout</option>
					</select>
				`:''}
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
		this.drawer = false
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
