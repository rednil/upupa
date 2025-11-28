
import { LitElement, html, css } from 'lit'
// live directive is needed because user can edit the value of the input.
// This tells Lit to dirty check against the live DOM value.
import {live} from 'lit/directives/live.js'
import { translate } from '../translator.js' 
import { confirm } from '../app/confirm.js'
import { mcp } from '../mcp.js'

export class ConfigBase extends LitElement {
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
				padding: 0.5em 0;
			}
			textarea {
				width: 100%;
			}
		`
	}
	render() {
		return [
			this.renderInput('name'),
			this.renderNote()
		]
	}
	renderInput(prop, options = {}){
		return html`
			<div>
				<label for=${prop}>${this.getLabel(prop)}</label>
				<input
					.disabled=${options.disabled}
					.type=${options.type || 'text'}
					placeholder=${options.placeholder}
					id=${prop}
					.value=${live(this.item[prop] || '')}
					@input=${this.changeCb}>
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
	async delete(){
		const confirmation = await confirm(`${this.item.name || this.item.username} löschen?`)
		if(confirmation) {
			return await mcp.db(this.type).remove(this.item)
		}
	}
	async submit(){
		if(!this.item.name) return alert(translate('MISSING_NAME'))
		return await mcp.db(this.type).put(mcp.finalize(this.item))
	}
}

customElements.define('config-base', ConfigBase)
