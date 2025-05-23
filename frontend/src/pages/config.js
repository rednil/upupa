import { LitElement, html } from 'lit'
import '../forms/select-item.js'
import '../components/boxes-edit.js'
import '../components/species-edit.js'

export class PageConfig extends LitElement {
	static get properties() {
		return {
			item: { type: Object },
			copy: { type: Object},
			collection: { type: String }
		}
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
			<select .value=${this.collection} @change=${evt => this.collection = evt.target.value}>
				<option value="boxes">Nistkasten</option>
				<option value="species">Vogelart</option>
			</select>
			<select-item style=${this.item._id ? '' : 'visibility:hidden'} .collection=${this.collection} .value=${this.item?.id} autoselect @change=${evt => this.item = evt.target.item}></select-item>
			<button @click=${this.addCb}>+</button>
			${this.renderConfig()}
			<button @click=${this.submit}>Speichern</button>
			<button>Änderungen verwerfen</button>
		`
	}
	renderConfig(){
		switch(this.collection){
			case 'boxes':
				return html`<boxes-edit .item=${this.copy}></boxes-edit>`
			case 'species':
				return html`<species-edit .item=${this.copy}></species-edit>`
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
