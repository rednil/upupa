import { LitElement, html, css } from 'lit'
import { proxy } from '../proxy.js'
const promises = {}

export class SelectItem extends LitElement {
	static get properties() {
		return {
			collection: { type: String }, // the api endpoint, e.g. "species"
			value: { type: String }, // the selected _id
			item: { type: Object }, // the selected document
			options: { type: Array }, // the api response 
			key: { type: String }, // the key used to name each option, e.g. "name"
			autoselect: { type: Boolean },
			disabled: { type: Boolean },
		}
	}

	static get styles() {
		return css`
			:host(.bold), :host(.bold) select {
				font-weight: bold;
			}
			
		`
	}
	constructor(){
		super()
		this.options = []
		this.key = 'name'
	}
	
	render() {
		return html`
			<select ?disabled=${this.disabled} .value=${this.value} id="select" @change=${this._changeCb}>
				${this.autoselect ? '' : html`<option>---</option>`}
				${this.options.map(option => html`
					<option ?selected=${option._id==this.value} value="${option._id}">${option[this.key]}</option>
				`)}
			</select>
		`
	}
	set value(value){
		this._value = value
		this.item = this.getSelectedItem()
	}
	get value(){
		return this._value
	}
	_changeCb(evt){
		this.value = evt.target.value
		this.dispatchEvent(new Event('change'))
	}
	updated(changedProps){
		if(changedProps.has('collection')) this.fetchData()
	}
	async fetchData(){
		const oldItem = this.item
		var [options] = await proxy.fetch([
			{path: this.collection},
		])
		this.options = options
		this.item = this.getSelectedItem()
		if(
			(this.value && !this.getSelectedItem()) ||
			(this.autoselect && !this.value && this.options.length>0)
		){
			this.value = options[0]._id
		}
		if(oldItem != this.getSelectedItem()) this.dispatchEvent(new Event('change'))
	}
	
	getSelectedItem(){
		return this.options.find(option => option._id == this.value)
	}
}

customElements.define('select-item', SelectItem)
