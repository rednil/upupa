import { SelectItem } from "./select-item"
import { mcp } from "../mcp"

export const getBoxLabel = box => {
	let label = box.name
	if(box.validUntil){
		label += ` (${formatDate(box.validFrom)}-${formatDate(box.validUntil)})`
	}
	return label
} 
	
const formatDate = date => `${new Date(date).getMonth()+1}/${new Date(date).getFullYear().toString().slice(-2)}`

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
		this.options = (await mcp.db().query('upupa/boxes', {
			startkey: [this.year],
			endkey: [this.year, {}],
			include_docs: true
		}))
		.rows.map(view => view.doc)
	}
	getLabel(option){
		return getBoxLabel(option)
	}
	
}


customElements.define('select-box', SelectBox)

