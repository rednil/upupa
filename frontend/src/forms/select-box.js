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
	getLabel(option){
		let label = option.name
		
		if(option.validUntil){
			const validFrom = new Date(option.validFrom)
			const validUntil = new Date(option.validUntil)
			const fromYear = validFrom.getFullYear()
			const toYear = validUntil.getFullYear()
			if(fromYear == toYear) label += ` (${fromYear})`
			else {
				const from = `${fromYear.toString().slice(-2)}/${validFrom.getMonth()+1}`
				const to = `${toYear.toString().slice(-2)}/${validUntil.getMonth()+1}`
				label += ` (${from}-${to})`
			}
		}
		return label
	}
	
}

customElements.define('select-box', SelectBox)

