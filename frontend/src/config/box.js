import { LitElement, html, css } from 'lit'
import '../forms/select-location.js'
import '../forms/select-item.js'
import { ConfigBase } from './base.js'
import { translate } from '../translator.js'

// live directive is needed because user can edit the value of the input.
// This tells Lit to dirty check against the live DOM value.
import { live } from 'lit/directives/live.js'
import { mcp } from '../mcp.js'
import { confirm } from '../app/confirm.js'
import { alert } from '../app/alert.js'
import { getBoxLabel } from '../forms/select-box.js'
import { finalize } from '../db.js'

const POSITIONING_ADJUST = 'POSITIONING_ADJUST'
const POSITIONING_MOVE = 'POSITIONING_MOVE'

export class EditBox extends ConfigBase {
	
	static get styles() {
		return [
			ConfigBase.styles,
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
			this.renderInput('validFrom', {type: 'date', disabled: this.moved()}),
			this.renderInput('validUntil', {type: 'date', disabled: this.moved()}),
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
					>${translate('ADJUST_POSITION')}</button>
					<button
						?disabled=${this.positionChanged && this.positioningMode == POSITIONING_ADJUST}
						@click=${this.moveBox}
					>${translate('MOVE_BOX')}</button>
				</div>
			`:''}
		`
	}

	adjustPosition(){
		this.positioningMode = POSITIONING_ADJUST
		this.locationSelector.edit(`${translate('ADJUST_POSITION')}: ${this.item.name}`)
		this.requestUpdate()
	}
	moveBox(){
		this.positioningMode = POSITIONING_MOVE
		this.locationSelector.edit(`${translate('MOVE_BOX')}: ${this.item.name}`)
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
	fetchInspections(box_id){
		return mcp.db('inspection').find({
			selector: {
				type: 'inspection',
				box_id
			}
		})
	}
	async submit(){
		const newBox = {...this.item}
		const items = [newBox]
		finalize(newBox)
		if(this.moved()) {
			const oldBox = {...this._backupItem}
			oldBox.validUntil = newBox.validFrom
 			items.push(oldBox)
			const inspections = await this.fetchInspections(oldBox._id)
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
	async delete(){
		const inspections = await this.fetchInspections(this.item._id)
		if(inspections?.docs?.length){
			console.log('inspections', inspections)
			await alert('Es sind Inspektionen für diesen Nistkasten eingetragen, er kann daher nicht gelöscht werden. Bitte entweder nur ein Abhängedatum eintragen oder alle Inspektionen löschen / verschieben.')
			return
		}
		const confirmation = await confirm(`${getBoxLabel(this.item)} löschen?`)
		if(confirmation){
			return await mcp.db('box').remove(this.item)
		}
	}
}

customElements.define('config-box', EditBox)
