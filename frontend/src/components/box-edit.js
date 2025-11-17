import { LitElement, html, css } from 'lit'
import '../forms/select-location.js'
import '../forms/select-item.js'
import { GenericEdit } from './generic-edit.js'
import { translate } from '../translator.js'

// live directive is needed because user can edit the value of the input.
// This tells Lit to dirty check against the live DOM value.
import { live } from 'lit/directives/live.js'

const POSITIONING_ADJUST = 'POSITIONING_ADJUST'
const POSITIONING_MOVE = 'POSITIONING_MOVE'

export class BoxEdit extends GenericEdit {
	static get properties() {
		return {
			item: { type: Object },
		}
	}
	static get styles() {
		return [
			GenericEdit.styles,
			css`
				:host > * {
					display: flex;
					justify-content: space-between;
					
				}
				select-location {
					height: 20em;
				}
				.movedate {
					display: flex;
					justify-content: space-between;
					padding-top: 0.5em;
				}
			`
		]
	}
	constructor(){
		super()
		this.type = 'box'
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
			this.renderItemSelector('architecture'),
			this.renderInput('validFrom', 'date'),
			this.renderItemSelector('mounting'),
			this.item.validUntil ? this.renderInput('validUntil', 'date') : '',
			this.renderMap(),
			this.renderNote()
		]
	}
	
	renderItemSelector(type){
		const key = `${type}_id`
		return html`
			<div>
				<label for=${key}>${translate(`${this.type}.${type}`)}</label>
				<select-item 
					id=${key}
					type=${type}
					@change=${this.changeCb}
					.value=${this.item[key]}
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
			>
				${this.positioningMode == POSITIONING_MOVE ? html`
					<div class="movedate">
						<label>Umgehängt am</label>
						<input type="date" value=${new Date().toLocaleDateString('en-CA')}>
					</div>
				`: ''}
			</select-location>
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
		this.positioningMode = POSITIONING_MOVE
		this.locationSelector.edit()
	}
	changePosCb(evt){
		if(this.positioningMode == POSITIONING_MOVE){
			delete this.item._id
			this.item.validFrom = this.shadowRoot.querySelector('.movedate input').value
		}
		this.item.lat = evt.target.value.lat
		this.item.lon = evt.target.value.lon
		this.dispatchEvent(new CustomEvent('change'))
		this.requestUpdate()
	}
}

customElements.define('box-edit', BoxEdit)
