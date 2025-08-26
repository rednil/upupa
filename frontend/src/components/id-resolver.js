
import { LitElement, html } from 'lit'
import { mcp } from '../mcp'

export class IdResolver extends LitElement {
	static get properties() {
		return {
			value: { type: String },
			type: { type: String },
			key: { type: String }
		}
	}
	constructor(){
		super()
		this.key = 'name'
		this.item = {}
	}
	updated(changed){
		if(changed.has('value') || changed.has('type')) this.fetchItem()
	}
	async fetchItem(){
		if(!(this.value && this.type && this.key)) return this.item = {}
		this.item = await mcp.db(this.type).get(this.value)
		this.requestUpdate()
	}
	render() {
		return html`
			${this.item[this.key] || ''}
		`
	}
	
}

customElements.define('id-resolver', IdResolver)
