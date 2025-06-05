import { LitElement, html, css } from 'lit'
import { Proxy } from '../proxy.js'
const promises = {}

export class SelectItem extends LitElement {
	static get properties() {
		return {
			type: { type: String }, // the api endpoint, e.g. "species"
			value: { type: String }, // the selected _id
			item: { type: Object }, // the selected document
			options: { type: Array }, // the api response 
			key: { type: String }, // the key used to name each option, e.g. "name"
			autoselect: { type: Boolean },
			disabled: { type: Boolean },
			readonly: { type: Boolean }
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
		this.proxy = new Proxy(this)

	}
	
	render() {
		if(this.readonly){
			return html`
				<span>${this.item && this.item[this.key]}</span>
			`
		}
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
		if(changedProps.has('type')) this._typeChanged()
		if(changedProps.has('options') && this.options.length) this._optionsChanged()
	}
	async _typeChanged(){
		if(!promises[this.type]) return this.fetchData()
		this.options = await promises[this.type]
	}
	_optionsChanged(){
		const oldItem = this.item
		this.item = this.getSelectedItem()
		if(
			this.options.length && 
			(this.value && !this.getSelectedItem()) ||
			(this.autoselect && !this.value && this.options.length>0)
		){
			this.value = this.options[0]._id
		}
		if(oldItem != this.getSelectedItem()) this.dispatchEvent(new Event('change'))
	}
	async fetchData(){
		promises[this.type] = this.proxy.query(this.type, {include_docs: true})
		this.options = await promises[this.type]
		console.log('options', this.options)
	}
	
	getSelectedItem(){
		return this.options.find(option => option._id == this.value)
	}
}

customElements.define('select-item', SelectItem)
