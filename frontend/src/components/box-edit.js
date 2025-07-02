import { LitElement, html, css } from 'lit'
import './select-location.js'
import '../forms/select-item.js'
import { translate } from '../translator.js' 
// live directive is needed because user can edit the value of the input.
// This tells Lit to dirty check against the live DOM value.
import { live } from 'lit/directives/live.js'

const POSITIONING_DISABLED = 'POSITIONING_DISABLED'
const POSITIONING_CORRECTION = 'POSITIONING_CORRECTION'
const POSITIONING_NEW_LOCATION = 'POSITIONING_NEW_LOCATION'

export class BoxEdit extends LitElement {
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
				padding: 0.3em 0;
			}
			select-location {
				height: 20em;
			}
			
		`
	}
	constructor(){
		super()
		this.positioning = POSITIONING_DISABLED
	}
	willUpdate(changedProps){
		if(changedProps.has('item')){
			this.positioning = this.item._id ? POSITIONING_DISABLED : POSITIONING_CORRECTION
			// some sensitive defaults for a new box
			this.item.lat = this.item.lat || this.backupItem?.lat || 46.832566887973776
			this.item.lon = this.item.lon || this.backupItem?.lon || 12.824698090553285
			// remember the position for cancel
			this.backupItem = {...this.item}
		}
		if(!this.item._id && !this.item.validFrom){
			this.item.validFrom = new Date().toISOString().split('T')[0]	
		
		}
	}
	updated(changedProps){
		super.updated(changedProps)
		
	}
	render() {
		return [
			this.renderInput('name'),
			this.renderArchitecture(),
			this.backupItem._id ? this.renderPositioningMode() : '',
			this.renderInput('validFrom', 'date'),
			this.item.validUntil ? this.renderInput('validUntil', 'date') : '',
			this.renderInput('lat', 'number', this.positioning==POSITIONING_DISABLED),
			this.renderInput('lon', 'number', this.positioning==POSITIONING_DISABLED),
			this.renderMap(),
		]
	}
	renderInput(prop, type="text", disabled=false){
		return html`
			<div>
				<label for=${prop}>${this.getLabel(prop)}</label>
				<input
					.disabled=${disabled}
					type=${type}
					id=${prop}
					.value=${live(this.item[prop] || '')}
					@input=${this.changeCb}>
			</div>
		`
	}
	renderArchitecture(){
		console.log('renderArch', this.item)
		return html`
			<div>
				<label for="architecture_id">Architektur</label>
				<select-item 
					id="architecture_id"
					type="architecture"
					@change=${this.changeCb}
					.value=${this.item.architecture_id}
				></select-item>
			</div>
		`
	}
	renderMap(){
		if(!(this.item.lat && this.item.lon)) return ''
		return html`
			<select-location
				.disabled=${this.positioning == POSITIONING_DISABLED}
				.value=${this.item}
				.oldValue=${this.backupItem}
				@change=${this.changePosCb}
			></select-location>
			
		`
	}
	renderPositioningMode(){
		const options = [POSITIONING_DISABLED, POSITIONING_CORRECTION]
		if(!this.item.validUntil) options.push(POSITIONING_NEW_LOCATION)
		return html`
			<div class="changepos">
				<label>Position</label>
				<select .value=${this.positioning} @change=${this.changePositioningModeCb}>
					${options.map(option => html`
						<option .selected=${this.positioning==option} value=${option}>${translate('BOX.'+option)}</option>
					`)}
				</select>
			</div>
		`
	}
	changePosCb(evt){
		this.item.lat = evt.target.value.lat
		this.item.lon = evt.target.value.lon
		this.dispatchEvent(new CustomEvent('change'))
		this.requestUpdate()
	}
	changePositioningModeCb(evt){
		this.positioning = evt.target.value
		this.item._id = this.backupItem._id
		switch(this.positioning){
			case POSITIONING_DISABLED: 
				this.item.lat = this.backupItem.lat
				this.item.lon = this.backupItem.lon
				this.dispatchEvent(new CustomEvent('change'))
				break
			case POSITIONING_NEW_LOCATION:
				delete this.item._id
				
				break
		}
		this.requestUpdate()
	}
	getLabel(prop){
		return translate(`BOX.${prop.toUpperCase()}`)
	}
	changeCb(evt){
		const { id, value } = evt.target
		this.item[id] = value
		this.dispatchEvent(new CustomEvent('change'))
	}
}

customElements.define('box-edit', BoxEdit)
