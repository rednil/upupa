import { LitElement, html, css } from 'lit'

const LOGIN = 'login'
const REGISTER = 'register'
export class PageLogin extends LitElement {
  
  static get properties() {
    return {
      mode: { type: String },
    }
  }

  static get styles() {
    return css`
      :host {
				flex:1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      div {
        display: flex;
        flex-direction: column;
       
      }
     
			button {
        padding: 0.5em;
				margin-top: 2em;
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

  render() {
    return html`
      
      <div>
				<label for="username">Username</label>
				<input type="email" id="username" .value=${this.user?.username || ''} >
				<label for="password">Password</label>
				<input id="password" type="password" placeholder=${this.user?._id?'Keep existing':''} >
				<div class="errormsg">${this.error}</div>
        <button @click=${() => this.auth(LOGIN)}>Sign In</button>
				<!--
        <button @click=${() => this.auth(REGISTER)}>Create Account</button>
				-->
      </div>
    `
  }

  async auth(mode){
    this.error = ''
		const username = this.shadowRoot.querySelector('#username').value
		const password = this.shadowRoot.querySelector('#password').value
    const response = await fetch(`/api/auth/${mode}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({username, password})
    })
    if(response.status != 200) this.error = response.statusText
    this.dispatchEvent(new CustomEvent((response?.status==200) ? 'login' : 'fetch-error', {
      composed: true,
      bubbles: true,
      detail: response
    }))
  }
}

customElements.define('page-login', PageLogin)
