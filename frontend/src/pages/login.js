import { html, css } from 'lit'
import { Page } from './base'

const LOGIN = 'login'
const REGISTER = 'register'
export class PageLogin extends Page {
  
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
				<input type="email" id="username">
				<label for="password">Password</label>
				<input id="password" type="password">
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
    if(mode==LOGIN){
			try{
				const userCtx = await this.proxy.db.login(username, password)
				console.log('login', userCtx)
				if(userCtx.name != null){
					this.dispatchEvent(new CustomEvent('login', {
						detail: userCtx
					}))
				}
			}catch(e){
				console.log('login exception', e)
				this.dispatchEvent('fetch-error', {
					detail: e
				})
			}
		}
  }
}

customElements.define('page-login', PageLogin)
