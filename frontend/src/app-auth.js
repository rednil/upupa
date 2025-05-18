import { LitElement, html, css } from 'lit'
import {ref, createRef} from 'lit/directives/ref.js'

export class AppAuth extends LitElement {
  static EDIT   = 'EDIT'
  static CREATE   = 'CREATE'
  static LOGIN    = 'LOGIN'
  static REGISTER = 'REGISTER'

  usernameRef = createRef()
  passwordRef = createRef()
  roleRef = createRef()

  static get properties() {
    return {
      mode: { type: String },
      user: { type: Object },
      self: { type: Object },
			error: { type: String }
    }
  }

  static get styles() {
    return css`
      :host {
        display:flex;
        flex-direction: column;
      }
			input, select {
				margin-bottom: 1em;
				height: 1.5em;
			}
			.errormsg {
				background-color: red;
			}
			select, input {
				border: 0;
				border-radius: 5px;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
			}
    `
  }

  constructor(){
    super()
    this.user = {}
    this.self = {}
		this.error = ""
  }
  
  render() {
    return html`
			<label for="username">Username</label>
      <input type="email" id="username" .value=${this.user?.username || ''} >
			<label for="password">Password</label>
      <input id="password" type="password" placeholder=${this.user?._id?'Keep existing':''} >
      ${this.mode == AppAuth.CREATE || this.mode == AppAuth.EDIT ? html`
				<label for="role">Role</label>
        <select id="role" label="Role" ${ref(this.roleRef)} .value=${this.user?.role || 'USER'}>
          <option value='USER'>User</option>
          <option value='ADMIN'>Admin</option>   
        </select>
      `:''}
			<div class="errormsg">${this.error}</div>
    `
  }

  getUserData(){
    const data = {} //...this.user}
    ;['username', 'password', 'role'].forEach(prop => {
      const dom = this.shadowRoot.querySelector('#'+prop)
      if(dom?.value && (dom.value != this.user[prop])) data[prop] = dom.value 
    })
    return data
  }
  async send(){
    this.error = ''
    const data = this.getUserData()
    let method = 'POST', path = '/api/users' 
    switch(this.mode){
      case AppAuth.LOGIN: 
        path = '/api/auth/login'
        break
      case AppAuth.REGISTER: 
        path = '/api/auth/register'
        break
      case AppAuth.EDIT:
        method = 'PUT'
        path = `api/users/${this.user._id}`
        break
    }
    //return console.log(method, path, data)
    const response = await fetch(path, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method,
      body: JSON.stringify(data)
    })
    if(response.status != 200) this.error = response.statusText
		return response
  }
 
}


customElements.define('app-auth', AppAuth)
