import { LitElement, html } from 'lit'
import '../forms/select-item.js'
import '../components/boxes-edit.js'
import '../components/species-edit.js'

export class PageConfig extends LitElement {
	static get properties() {
		return {
			item: { type: Object },
			collection: { type: String }
		}
	}
	constructor(){
		super()
		this.collection = 'boxes'
		this.item = {}
		
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
			<button>Save</button>
		`
	}
	renderConfig(){
		switch(this.collection){
			case 'boxes':
				return html`<boxes-edit .item=${this.item}></boxes-edit>`
			case 'species':
				return html`<species-edit .item=${this.item}></species-edit>`
		}
	}
	addCb(){
		this.item = {}
	}
}

customElements.define('page-config', PageConfig)
