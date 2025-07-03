
import { LitElement, html, css } from 'lit'
// live directive is needed because user can edit the value of the input.
// This tells Lit to dirty check against the live DOM value.
import {live} from 'lit/directives/live.js'
import { translate } from '../translator.js' 

export class GenericEdit extends LitElement {
	static get properties() {
			return {
				item: { type: Object },
				type: { type: String }
			}
		}
		static get styles() {
			return css`
				:host > * {
					display: flex;
					justify-content: space-between;
				}
				textarea {
					width: 100%;
					margin-top: 1em;
				}
			`
		}
		render() {
			return [
				this.renderInput('name'),
				this.renderNote()
			]
		}
		renderInput(prop){
			return html`
				<div>
					<label for=${prop}>${this.getLabel(prop)}</label>
					<input id=${prop} .value=${live(this.item[prop] || '')} @input=${this.changeCb}>
				</div>
			`
		}
		renderNote(){
			return html`
				<div class="note">
					<textarea
						id="note"
						placeholder="Bemerkung"
						.value=${this.item.note || ''}
						@input=${this.changeCb}
					></textarea>
				</div>
			`
		}
		getLabel(prop){
			return translate(`${this.type}.${prop}`.toUpperCase())
		}
		changeCb(evt){
			const { id, value } = evt.target
			this.item[id] = value
			if(value == '') delete this.item[id]
			this.dispatchEvent(new CustomEvent('change'))
		}
}

customElements.define('generic-edit', GenericEdit)
