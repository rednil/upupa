import { LitElement, html, css } from 'lit'
import '../forms/select-item.js'
import '../components/box-edit.js'
import '../components/species-edit.js'
import '../components/user-edit.js'
import '../app-dialog.js'
import { Proxy } from '../proxy.js'
export class PageConfig extends LitElement {
	static get properties() {
		return {
			item_id: { type: String },
			copy: { type: Object},
			collection: { type: String }
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
		this.collection = 'boxes'
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
					<select .value=${this.collection} @change=${this.changeCollectionCb}>
						<option value="boxes">Nistkasten</option>
						<option value="species">Vogelart</option>
						<option value="users">Benutzer</option>
					</select>
					<select-item 
						style=${this.item._id ? '' : 'visibility:hidden'}
						.collection=${this.collection} 
						.value=${this.item_id} 
						autoselect
						key=${this.collection == 'users' ? 'username' : 'name'}
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
		this.collection = evt.target.value
		history.replaceState({},null,`#/config?collection=${this.collection}`)
	}
	changeItemCb(evt){
		this.item = evt.target.item
		this.item_id = evt.target.value
		this.updateHash()
	}
	renderConfig(){
		switch(this.collection){
			case 'boxes':
				return html`<box-edit .item=${this.copy} ></box-edit>`
			case 'species':
				return html`<species-edit .item=${this.copy}></species-edit>`
			case 'users':
				return html`<user-edit .item=${this.copy}></user-edit>`
		}
	}
	addCb(){
		this._backupItem = {...this.item}
		this.item = {} 
	}
	confirmDeletion(){
		this.shadowRoot.querySelector('#delete-dialog').open = true
	}
	async delete(){
		this.shadowRoot.querySelector('#delete-dialog').open = false
		const response = await this.proxy.delete(this.collection, this.item)
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
		history.replaceState({},null,`#/config?collection=${this.collection}&item_id=${this.item_id}`)
	}
	async submit(){
		const response = await this.proxy.set(this.collection, this.copy)
		if(response?.insertedId){
			this.item_id=response.insertedId
			this.updateHash()
		}
		this.shadowRoot.querySelector('select-item').fetchData()
	}
}

customElements.define('page-config', PageConfig)
