
import { LitElement, html, css } from 'lit'
import { translate } from '../translator.js' 

export class SpeciesEdit extends LitElement {
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
			return translate(`SPECIES.${prop.toUpperCase()}`)
		}
		changeCb(evt){
			const { id, value } = evt.target
			this.item[id] = value
		}
}

customElements.define('species-edit', SpeciesEdit)
