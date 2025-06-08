import { LitElement, html, css } from 'lit'
import '../forms/select-item.js'
import '../components/box-edit.js'
import '../components/generic-edit.js'
import '../components/user-edit.js'
import '../app-dialog.js'
import { Proxy } from '../proxy.js'
export class PageConfig extends LitElement {
	static get properties() {
		return {
			_id: { type: String },
			copy: { type: Object},
			type: { type: String }
		}
	}
	static get styles() {
		return css`
			:host  {
				flex: 1;
			}
			:host > div {
				min-height: 0;
			}
			:host > div > div {
				max-width: 40em;
				margin: 0 auto;
				padding: 0.5em;
			}
			
			.bottom {
				overflow-y: auto;
			}
			.bottom {
				display: flex;
				justify-content: space-between
			}
		`
	}
	constructor(){
		super()
		this.proxy = new Proxy(this)
		this.type = 'box'
		this._item = {}
		this.copy = {}
		
	}
	set item(item = {}){
		this._item = item
		this.copy = {...item}
	}
	get item(){
		return this._item
	}
	render() {
		return html`
			<div>
				<div class="top">
					<select .value=${this.type} @change=${this.changeCollectionCb}>
						<option value="box">Nistkasten</option>
						<option value="species">Vogelart</option>
						<option value="perpetrator">Eindringling</option>
					</select>
					<select-item 
						style=${(this.item && !this.item._id) ? 'visibility:hidden' : ''}
						.type=${this.type} 
						.value=${this._id} 
						autoselect
						key=${this.type == 'users' ? 'username' : 'name'}
						@change=${this.changeItemCb}
					></select-item>
					<button @click=${this.addCb}>+</button>
				</div>
				<div class="center">
					${this.renderConfig()}
				</div>
				<div class="bottom">
					<button @click=${this.confirmDeletion}>Löschen</button>
					<button @click=${this.cancel}>Änderungen verwerfen</button>
					<button @click=${this.submit}>Speichern</button>
				</div>
			</div>
			<app-dialog
				id="delete-dialog"
				primary="Abbrechen"
				secondary="Löschen"
				@secondary=${this.delete}
				discard="primary"
				title="Löschen"
			>
				<div>${this.item.name || this.item.username}</div>
      </app-dialog>
		`
	}
	changeCollectionCb(evt){
		this.type = evt.target.value
		history.replaceState({},null,`#/config?type=${this.type}`)
	}
	changeItemCb(evt){
		console.log('changeItemCb', evt.target.item)
		this.item = evt.target.item
		this._id = evt.target.value
		this.updateHash()
	}
	renderConfig(){
		switch(this.type){
			case 'box':
				return html`<box-edit .item=${this.copy} ></box-edit>`
			case 'species':
			case 'perpetrator':
				return html`<generic-edit .item=${this.copy}></generic-edit>`
			case 'users':
				return html`<user-edit .item=${this.copy}></user-edit>`
		}
	}
	addCb(){
		this._backupItem = {...this.item}
		this.item = {
			type: this.type,
		} 
	}
	confirmDeletion(){
		this.shadowRoot.querySelector('#delete-dialog').open = true
	}
	async delete(){
		this.shadowRoot.querySelector('#delete-dialog').open = false
		const response = await this.proxy.db.remove(this.item)
		if(response?.deletedCount){
			this.shadowRoot.querySelector('select-item').fetchData()
		}
	}
	cancel(){
		if(this._backupItem) {
			this.item = this._backupItem
			delete this._backupItem
		}
		this.copy = {...this.item} 
	}
	updateHash(){
		history.replaceState({},null,`#/config?type=${this.type}&_id=${this._id}`)
	}
	async submit(){
		const response = await this.proxy.put(this.copy)
		console.log('response', response)
		if(response?.insertedId){
			this._id=response.insertedId
			this.updateHash()
		}
		this.proxy.clearTypeCache(this.type)
		this.shadowRoot.querySelector('select-item').fetchOptions()
	}
}

customElements.define('page-config', PageConfig)
