import { LitElement, html, css } from 'lit'
import {AppAuth} from './app-auth'

export class AppLogin extends LitElement {
  
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
     
    `
  }

  constructor(){
    super()
    this.mode = AppAuth.LOGIN 
  }

  render() {
    return html`
      
      <div>
        <app-auth mode=${this.mode}></app-auth>
        <button @click=${this.signIn}>Sign In</button>
				<!--
        <button @click=${this.signUp}>Create Account</button>
				-->
      </div>
    `
  }

  /*
  async postCredentials(type) {
    this.error = ''
    const username = this.usernameRef.value.value
    const password = this.passwordRef.value.value
    console.log('signIn', username, password)
    const response = await fetch(`/api/auth/${type}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({username, password})
    })
    this.dispatchEvent(new CustomEvent((response?.status==200) ? 'login' : 'fetch-error', {
      composed: true,
      bubbles: true,
      detail: response
    }))
  }
  */

  async login(){
    const response = await this.shadowRoot.querySelector('app-auth').send()
    this.dispatchEvent(new CustomEvent((response?.status==200) ? 'login' : 'fetch-error', {
      composed: true,
      bubbles: true,
      detail: response
    }))
  }
  signIn(){
    this.mode = AppAuth.LOGIN 
    this.login()
  }
  signUp(){
    this.mode = AppAuth.REGISTER 
    this.login()
  }
}

customElements.define('app-login', AppLogin)
