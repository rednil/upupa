import { LitElement, html, css } from 'lit'
import { translate } from '../translator.js' 
// live directive is needed because user can edit the value of the input.
// This tells Lit to dirty check against the live DOM value.
import {live} from 'lit/directives/live.js'
export class BoxesEdit extends LitElement {
	static get properties() {
		return {
			item: { type: Object },
		}
	}
	static get styles() {
		return css`
			:host > * {
				display: flex;
				justify-content: space-between;
			}
		`
	}
	render() {
		return [
			this.renderInput('name'),
			this.renderInput('lat', 'number'),
			this.renderInput('lon', 'number')
		]
	}
	renderInput(prop, type){
		return html`
			<div>
				<label for=${prop}>${this.getLabel(prop)}</label>
				<input type=${type} id=${prop} .value=${live(this.item[prop] || '')} @change=${this.changeCb}>
			</div>
		`
	}
	getLabel(prop){
		return translate(`BOXES.${prop.toUpperCase()}`)
	}
	changeCb(evt){
		const { id, value } = evt.target
		this.item[id] = value
	}
}

customElements.define('boxes-edit', BoxesEdit)
