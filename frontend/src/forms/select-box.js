import { SelectItem } from "./select-item"

export class SelectBox extends SelectItem {
	static get properties() {
		return {
			year: { type: Number }
		}
	}
	constructor(){
		super()
		this.type = 'box'
		this.autoselect = true
	}
	updated(changedProps){
		super.updated(changedProps)
		if(!changedProps.has('type') && changedProps.has('year')) this.fetchOptions()
	}
	
	async fetchOptions(){
		this.options = await this.proxy.query('boxes', {
			startkey: [this.year],
			endkey: [this.year, {}],
			include_docs: true
		})
	}
	
}

customElements.define('select-box', SelectBox)

