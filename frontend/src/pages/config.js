import { LitElement, html, css } from 'lit'
import '../forms/select-item.js'
import '../components/boxes-edit.js'
import '../components/species-edit.js'
import '../components/users-edit.js'

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
						style=${this.item_id ? '' : 'visibility:hidden'}
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
					<button @click=${this.submit}>Speichern</button>
					<button>Änderungen verwerfen</button>
				</div>
			</div>
		`
	}
	changeCollectionCb(evt){
		this.collection = evt.target.value
		history.replaceState({},null,`#/config?collection=${this.collection}`)
	}
	changeItemCb(evt){
		this.item = evt.target.item
		this.item_id = evt.target.value
		history.replaceState({},null,`#/config?collection=${this.collection}&item_id=${this.item_id}`)
	}
	renderConfig(){
		switch(this.collection){
			case 'boxes':
				return html`<boxes-edit .item=${this.copy}></boxes-edit>`
			case 'species':
				return html`<species-edit .item=${this.copy}></species-edit>`
			case 'users':
				return html`<users-edit .item=${this.copy}></users-edit>`
		}
	}
	addCb(){
		this.item = {}
	}
	async submit(){
		const response = await proxy.set(this.collection, this.copy, this)
	}
}

customElements.define('page-config', PageConfig)
