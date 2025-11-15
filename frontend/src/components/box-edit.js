import { LitElement, html, css } from 'lit'
import '../forms/select-location.js'
import '../forms/select-item.js'
import { translate } from '../translator.js' 
// live directive is needed because user can edit the value of the input.
// This tells Lit to dirty check against the live DOM value.
import { live } from 'lit/directives/live.js'

const POSITIONING_ADJUST = 'POSITIONING_ADJUST'
const POSITIONING_MOVE = 'POSITIONING_MOVE'

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
	
	willUpdate(changedProps){
		if(changedProps.has('item')){
			this.positioningMode = null
			this._backupItem = {...this.item}

		}
		if(!this.item._id && !this.item.validFrom){
			this.item.validFrom = new Date().toISOString().split('T')[0]	
		}
	}
	
	firstUpdated(){
		this.locationSelector = this.shadowRoot.querySelector('select-location')	
	}
	render() {
		return [
			this.renderInput('name'),
			this.renderArchitecture(),
			this.renderInput('validFrom', 'date'),
			this.item.validUntil ? this.renderInput('validUntil', 'date') : '',
			this.renderMap(),
		]
	}
	renderInput(prop, type="text", disabled=false){
		return html`
			<div>
				<label for=${prop}>${this.getLabel(prop)}</label>
				<input
					.disabled=${disabled}
					.type=${type}
					id=${prop}
					.value=${live(this.item[prop] || '')}
					@input=${this.changeCb}>
			</div>
		`
	}
	renderArchitecture(){
		return html`
			<div>
				<label for="architecture_id">${translate('ARCHITECTURE')}</label>
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
		const newBox = !Boolean(this._backupItem._id)
		const ancientBox = this._backupItem.validUntil
		const moveBoxButtonRequired = !(newBox || ancientBox)
		//if(!(this.item.lat && this.item.lon)) return ''
		return html`
			<select-location
				?disabled=${moveBoxButtonRequired}
				.value=${this.item}
				@change=${this.changePosCb}
			></select-location>
			${moveBoxButtonRequired ? html`
				<div>
					<button
						?disabled=${this.positioningMode == POSITIONING_MOVE}
						@click=${this.adjustPosition}
					>Position korrigieren</button>
					<button
						?disabled=${this.positioningMode == POSITIONING_ADJUST}
						@click=${this.moveBox}
					>Nistkasten umhängen</button>
				</div>
			`:''}
			
			
		`
	}

	adjustPosition(){
		this.positioningMode = POSITIONING_ADJUST
		this.locationSelector.edit()
	}
	moveBox(){
		delete this.item._id
		this.positioningMode = POSITIONING_MOVE
		this.locationSelector.edit()
	}
	changePosCb(evt){
		this.item.lat = evt.target.value.lat
		this.item.lon = evt.target.value.lon
		this.dispatchEvent(new CustomEvent('change'))
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
