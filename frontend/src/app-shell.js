import { LitElement, html, css } from 'lit'
import {ref, createRef} from 'lit/directives/ref.js'

import './app-main'
import './app-login'
import './app-menu'
import './app-users'

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

class Routes { 
  constructor (host, routes){
    this.host = host
    this.routes = routes
  }
  outlet(){
    const path = window.location.hash
    return this.routes.find(route => route.path == path).render()
  }
}

export class AppShell extends LitElement {
  static get properties() {
    return {
      self: { type: Object },
      error: { type: String },
			drawer: { type: Boolean }
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
			.center {
				display: flex;
				flex-direction: row;
				flex: 1;
			}
			.drawer {
				display: flex;
				flex-direction: column;
				position: fixed;
				left: -10em;
				transition: left 0.3s ease-in-out;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
			}
      .logged-out button, .logged-out select {
        display: none;
      }
			.top {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
			}
			main {
				display: flex;
				flex: 1;
				padding: 1em;
			}
			.bottom {
				background-color: red;
			}
			.title {
				margin: auto;
				
			}
			.drawer.open {
				left: 0;
			}
			.menutoggle{
				border: 0;
				padding: 0.5em 1em;
			}
			select{
				border: 0;
			}
    `
  }

  // create references to the DOM nodes we need to access
  //drawer = createRef()
  //snackbar = createRef()

  constructor() {
    super()
    this.routes = new Routes(this, [
      { path: '',        render: () => html`<app-main .user=${this.self}></app-main>` },
      { path: '#/login', render: () => html`<app-login @login=${this.requestUserInfo}></app-login>` },
      { path: '#/users', render: () => html`<app-users .self=${this.self}></app-users>` }
    ])
    window.onpopstate = e => {
      this.drawer = false
      //this.requestUpdate()
    }
    this.addEventListener('fetch-error', evt => this.handleFetchError(evt.detail))
    this.requestUserInfo()
    this.error = ''
		this.drawer = false
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

  toggleNav(){
    this.drawer = !this.drawer
  }

	/*

	<mwc-drawer class=${this.self?'logged_in':'logged_out'} hasHeader ${ref(this.drawer)} type="modal">
        <span slot="title">My App</span>
        <span slot="subtitle">Navigation</span>
        <app-menu></app-menu>
        <div class="appContent" slot="appContent">
            <mwc-top-app-bar role="toolbar">
              <mwc-icon-button @click=${this.toggleNav} icon="menu" slot="navigationIcon"></mwc-icon-button>
              <div slot="title">My App</div>
              <mwc-item slot="actionItems">${this.self?.username}</mwc-item>
              <mwc-icon-button icon="logout" @click=${this.requestLogout} slot="actionItems"></mwc-icon-button>
            </mwc-top-app-bar>
            <main>${this.routes.outlet()}</main>
        </div>
      </mwc-drawer>
      <mwc-snackbar @MDCSnackbar:closed=${()=>this.error=''} labelText=${this.error} ${ref(this.snackbar)}>
        <mwc-icon-button icon="close" slot="dismiss"></mwc-icon-button>
      </mwc-snackbar>

			*/
 
  render() {
    return html`
			<div class="top ${this.self?'logged-in':'logged-out'}">
				<button class="menutoggle" @click=${this.toggleNav}>☰</button>
				<span class="title">My App</span>
				${this.self?html`
					<select class="logout">
						<option selected>${this.self?.username}</option>
						<option @click=${this.requestLogout}>Logout</option>
					</select>
				`:''}
			</div>
			<div class="center ">
				<app-menu class="drawer ${this.drawer ? "open" : "closed"}"></app-menu>
				<main>${this.routes.outlet()}</main>
			</div>
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
