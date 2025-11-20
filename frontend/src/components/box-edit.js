import { LitElement, html, css } from 'lit'
import '../forms/select-location.js'
import '../forms/select-item.js'
import { GenericEdit } from './generic-edit.js'
import { translate } from '../translator.js'

// live directive is needed because user can edit the value of the input.
// This tells Lit to dirty check against the live DOM value.
import { live } from 'lit/directives/live.js'
import { mcp } from '../mcp.js'
import { confirm } from '../forms/confirm.js'

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
			this.positionChanged = false
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
			this.renderInput('validFrom', 'date', this.moved()),
			this.renderInput('validUntil', 'date', this.moved()),
			this.renderItemSelector('mounting'),
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
				`:''}
			</select-location>
			${moveBoxButtonRequired ? html`
				<div>
					<button
						?disabled=${this.positionChanged && this.positioningMode == POSITIONING_MOVE}
						@click=${this.adjustPosition}
					>Position korrigieren</button>
					<button
						?disabled=${this.positionChanged && this.positioningMode == POSITIONING_ADJUST}
						@click=${this.moveBox}
					>Nistkasten umhängen</button>
				</div>
			`:''}
		`
	}

	adjustPosition(){
		this.positioningMode = POSITIONING_ADJUST
		this.locationSelector.edit()
		this.requestUpdate()
	}
	moveBox(){
		this.positioningMode = POSITIONING_MOVE
		this.locationSelector.edit()
		this.requestUpdate()
	}
	changePosCb(evt){
		if(this.positioningMode == POSITIONING_MOVE){
			delete this.item._id
			delete this.item._rev
			this.item.validFrom = this.shadowRoot.querySelector('.movedate input').value
		}
		this.positionChanged = true
		this.item.lat = evt.target.value.lat
		this.item.lon = evt.target.value.lon
		this.dispatchEvent(new CustomEvent('change'))
		this.requestUpdate()
	}
	moved(){
		return this.positionChanged && this.positioningMode == POSITIONING_MOVE
	}
	async submit(){
		const newBox = {...this.item}
		const items = [newBox]
		mcp.finalize(newBox)
		if(this.moved()) {
			const oldBox = {...this._backupItem}
			oldBox.validUntil = newBox.validFrom
 			items.push(oldBox)
			const inspections = await mcp.db('inspection').find({
				selector: {
					type: 'inspection',
					box_id: oldBox._id
				}
			})
			const orphans = inspections.docs.filter(({date}) => {
				date = new Date(date)
				// inspections that happened BEFORE the move
				if(date <= new Date(newBox.validFrom)) return false
				// for retroactive moves, even IF there are boxes past the original validUntil,
				// keep them in the newBox because they would fit even LESS into the oldBox
				return true
			})
			if(orphans.length){
				const confirmation = await confirm(`${translate('INSPECTIONS_TO_MOVE')}: ${orphans.length}`)
				if(confirmation){
					items.push(...orphans.map(inspection => {
						inspection.box_id = newBox._id
						return inspection
					}))
				}
				else return
			}
		}
		const response = await mcp.db(this.type).bulkDocs(items)
		return response[0]
	}
}

customElements.define('box-edit', BoxEdit)
