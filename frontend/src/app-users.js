import { LitElement, html, css } from 'lit'
import {AppAuth} from './app-auth'
import './app-dialog'

export class AppUsers extends LitElement {

  static get properties() {
    return {
      users: { type: Array },
      mode: { type: String },
      self: { type: Object },
      selected: { type: Object }
    }
  }

  static get styles() {
    return css`
      :host * {
        display: flex;
        
      }
			:host {
				margin: auto;
				flex-direction: column;
			}
      .user {
        display: flex;
      }

      .properties {
        display: flex;
        margin: 0 1em;
        
      }
			.create {
				position: fixed;
				font-size: xx-large;
				bottom: 10vmin;
				right: 10vmin;
				padding: 0 0.25em;
			}
     
      .list {
        margin: auto;
				flex-direction: column;
      }
      .item-content {
        display:flex;
      }
      .label {
				padding-right: 1em;
				flex-direction: column;
				width: 10em;
				
      }
      .role {
        font-size: smaller;
        opacity: 0.5;
      }
			.actions button {
				margin: auto 0.5em;
			}
			button {
				border: 0;
				padding: 0.5em;
				border-radius: 5px;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
			}
    `
  }

  constructor(){
    super()
    this.users = []
    this.mode = ''
  }

  render() {
    return html`
      <button class="create" @click=${this.openUserDialog(AppAuth.CREATE)}>+</button>
      <div class="list">
        ${this.users.map(user => html`
          <div class="user">
            <span class="label">
              <div class="username">${user.username}</div>
              <div class="role">${user.role}</div>
            </span>
						<span class="actions">
							<button .data=${user} @click=${this.openUserDialog(AppAuth.EDIT)}>Edit</button>
							<button @click=${() => this.deleteCb(user)}>Delete</button>
						</span>
          </div>
        `)}
      </div>
      
      <app-dialog
				id="delete-dialog"
				primary="Cancel"
				secondary="Delete"
				@secondary=${this.deleteUser}
				discard="primary"
				title="Delete User"
			>
				<div class="username">${this.selected?.username}</div>
        <div class="role">${this.selected?.role}</div>
      </app-dialog>
      <app-dialog
				id="user-dialog"
			 	?open=${this.mode == AppAuth.EDIT}
				primary="Save"
				secondary="Cancel"
				@primary=${this.userAction}
				discard="secondary"
				title="${this.getUserDialogTitle()}"
			>
        <app-auth mode=${this.mode} .user=${this.selected} .self=${this.self}></app-auth>
      </app-dialog>
    `
  }

  connectedCallback(){
    super.connectedCallback()
    console.log('connected')
    this.fetchUsers()
		
		console.log('dialogs', this.deleteDialog, this.userDialog)
  }

	firstUpdated(){
		this.deleteDialog = this.shadowRoot.querySelector('#delete-dialog')
		this.userDialog = this.shadowRoot.querySelector('#user-dialog')
	}
  
  deleteCb(user){
    this.selected = user
    this.deleteDialog.open = true
  }

  async fetchUsers(){
    const response = await fetch('/api/users')
    if(this.noError(response)) {
      this.users = await response.json()
    }
  }

  noError(response){
    if(response.status == 200) return true
    else {
      this.dispatchEvent(new CustomEvent('fetch-error', { detail: response }))
    }
  }
  
  async deleteUser(evt){
    const id = this.selected._id
    const response = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if(this.noError(response)) {
      this.users.splice(this.users.findIndex(user => user._id == id),1)
      this.deleteDialog.open = false
			this.requestUpdate()
    }
  }
  
  async userAction(){
    const response = await this.shadowRoot.querySelector('app-auth').send()
    if(this.noError(response)) {
      const updatedUsers = await response.json()
			this.userDialog.open = false
      this.mergeUsers(updatedUsers)
    }
  }

  mergeUsers(updatedUsers = []){
    if(!Array.isArray(updatedUsers)) updatedUsers = [updatedUsers]
    updatedUsers.forEach(updatedUser => {
      const idx = this.users.findIndex(user => user._id == updatedUser._id)
      if(idx >= 0) this.users[idx] = updatedUser
      else this.users.push(updatedUser)
      this.requestUpdate()
    })
  }
  getUserDialogTitle(){
    return this.mode == AppAuth.EDIT ? `Edit User: ${this.selected.username}` : 'Create User'
  }
  openUserDialog(mode){
    return evt => {
      this.mode = mode
      this.selected = evt.target.data
      this.userDialog.open = true
    }
  }
}


customElements.define('app-users', AppUsers)
