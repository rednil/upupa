import { LitElement, html, css } from 'lit'
import { mcp } from '../mcp'

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
			readonly: { type: Boolean },
			buttons: { type: Boolean },
			emptyLabel: { type: String }
		}
	}

	static get styles() {
		return css`
			:host{
				display: flex;
			}
			:host(.bold), :host(.bold) select {
				font-weight: bold;
			}
			:host(.borderless) select {
				border: 0;
				outline: none;
				background-color: transparent
			}
		`
	}
	constructor(){
		super()
		this.options = []
		this.emptyLabel = '---'
		this.key = 'name'
		this.buttons = false
	}
	
	render() {
		if(this.readonly){
			return html`
				<span>${this.item && this.item[this.key]}</span>
			`
		}
		console.log('select-item value', this.value)
		const value = (this.value == undefined) ? this.emptyLabel : this.value 
		return html`
			${this.buttons ? html`<button @click=${() => this.skip(-1)}><</button>`:''}
			<select ?disabled=${this.disabled} .value=${value} id="select" @change=${this._changeCb}>
				${this.autoselect ? '' : html`
					<option ?selected=${value==this.emptyLabel} >${this.emptyLabel}</option>`
				}
				${this.options.map(option => html`
					<option ?selected=${option._id==value} value="${option._id}">${this.getLabel(option)}</option>
				`)}
			</select>
			${this.buttons ? html`<button @click=${() => this.skip(1)}>></button>`:''}
		`
	}
	set value(value){
		this._value = value
		this.item = this.getSelectedItem()
	}
	get value(){
		return this._value
	}
	
	// overwritten in select-box
	getLabel(option){
		return option[this.key]
	}
	skip(n){
		let idx = this.findOptionIdx() + n
		if(idx<0) idx = this.options.length - 1
		if(idx>=this.options.length) idx = 0
		this.value = this.options[idx]._id
		this.dispatchEvent(new Event('change'))
	}
	
	findOptionIdx(){
		return this.options.findIndex(({_id}) => _id == this.value)
	}
	_changeCb(evt){
		console.log('select-item change', this.value, this.value == undefined, this.value =='')
		this.value = evt.target.value
		if(this.value == this.emptyLabel) this.value = undefined
		this.dispatchEvent(new Event('change'))
	}
	updated(changedProps){
		if(changedProps.has('type')) this.fetchOptions()
		if(changedProps.has('options') && this.options.length) this._optionsChanged()
	}
	async fetchOptions(){
		this.options = await mcp.getByType(this.type)
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
			this.dispatchEvent(new Event('change'))
		}
		// required if parent hands in _id but requires item 
		else if(oldItem != this.getSelectedItem()) this.dispatchEvent(new Event('change'))
	}
	
	getSelectedItem(){
		return this.options.find(option => option._id == this.value)
	}
}

customElements.define('select-item', SelectItem)

