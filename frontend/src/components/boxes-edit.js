import { LitElement, html } from 'lit'
import { translate } from '../translator.js' 

export class BoxesEdit extends LitElement {
	static get properties() {
		return {
			item: { type: Object },
		}
	}
	constructor(){
		super()
		this.item = {}
	}
	
	render() {
		return [
			this.renderInput('name'),
			this.renderInput('lat'),
			this.renderInput('lon')
		]
	}
	renderInput(prop){
		return html`
			<div>
				<label for=${prop}>${this.getLabel(prop)}</label>
				<input id=${prop} .value=${this.item[prop] || ''} @change=${this.changeCb}>
			</div>
		`
	}
	getLabel(prop){
		return translate(`BOXES.${prop.toUpperCase()}`)
	}
	changeCb(evt){
		const { id, value } = evt.target
		return evt => this.item[id] = value
	}
	
}

customElements.define('boxes-edit', BoxesEdit)
