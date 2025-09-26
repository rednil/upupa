
import { LitElement, html, css } from 'lit'
// live directive is needed because user can edit the value of the input.
// This tells Lit to dirty check against the live DOM value.
import {live} from 'lit/directives/live.js'
import { translate } from '../translator.js' 
import { mcp } from '../mcp.js'
export class ProjectEdit extends LitElement {
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
			textarea {
				width: 100%;
				margin-top: 1em;
			}
		`
	}
	
	render() {
		return [
			this.renderInput('name'),
			this.renderInput('remoteDB'),
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
	renderCheckbox(prop){
		return html`
			<div>
				<label for=${prop}>${this.getLabel(prop)}</label>
				<input type="checkbox" id=${prop} .checked=${this.item[prop]} @input=${this.checkboxCb}>
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
		return translate(`PROJECT.${prop}`.toUpperCase())
	}
	changeCb(evt){
		const { id, value } = evt.target
		this.item[id] = value
		if(value == '') delete this.item[id]
		this.dispatchEvent(new CustomEvent('change'))
	}
	checkboxCb(evt){
		const { id, checked } = evt.target
		this.item[id] = checked
		this.dispatchEvent(new CustomEvent('change'))
	}
}

customElements.define('project-edit', ProjectEdit)
