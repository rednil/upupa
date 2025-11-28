import { html,css, LitElement } from 'lit'
import { translate } from '../translator'
import { mcp } from '../mcp.js'
import '../forms/select-item.js'
import '../forms/select-box.js'
import '../forms/select-state.js'
import '../view/inspection.js'
import '../view/id.js'
import { incDate } from './calendar.js'
import { setUrlParams } from '../router.js'
import { INSPECTION_STATES } from '../forms/select-state.js'
import { finalize } from '../db.js'

const bandingStartAge = 7
const bandingEndAge = 12
const currentYear = new Date().getFullYear()

const formatDateForInput = date => date ? new Date(date).toISOString().split('T')[0] : null
const dateToArr = date => formatDateForInput(date).split('-').map(x => Number(x))

const events = ['layingStart', 'breedingStart', 'hatchDate']

export class PageInspection extends LitElement {
	static get properties() {
		return {
			box_id: { type: String },
			inspection_id: { type: String },
			previousInspection: { type: Object },
			inspection: { type: Object },
			year: { type: Number }
		}
	}
	static get styles() {
		return css`
			:host  {
				flex: 1;
				overflow-y: auto;
			}
			
			:host > div > div {
				max-width: 40em;
				margin: 0 auto;
				justify-content: space-between;
				display: flex;
				padding: 0.5em ;
			}
			.box, .date > span, .banding > span, .nestlingsAge > span  {
				display: flex;
			}
			.date input {
				width: fit-content;
			}
			.nestlingsAge > span > span {
				margin: auto 0.25em;
			}
			
			:host > div > div.buttons {
				display: flex;
				justify-content: space-between;
				margin: 1em auto;
			}
			textarea {
				flex: 1;
			}
			
			:host > div > div.editwarning {
				background-color: red;
				color: white;
				justify-content: center;
			}
			.tainted {
				background-color: rgba(255,0,0,0.1);
			}
			:host > div.SCOPE_OUTSIDE > div {
				display: none;
			}
			:host > div.SCOPE_OUTSIDE > .outside,
			:host > div.SCOPE_OUTSIDE > .date,
			:host > div.SCOPE_OUTSIDE > .buttons {
				display: flex;
			}
			.previousInspection {
				flex-direction: column;
			}
			#delete-box-name {
				display: inline;
			}
		`
	}
	
	constructor(){
		super()
		this.year = currentYear
		this.previousInspection = {}
		this.mode = 'MODE_CREATE'
		this.maxOccupancy = 0
	}
	render() {
		const i = this.inspection
		if(!i) return
		return html`
			<div class="${this.inspection.state} ${this.mode} ${this.inspection.scope}">
				${[
					//this.renderMode(),
					this.renderHead(),
					this.inspection_id ? this.renderEditWarning() : '',
					this.inspection_id ? this.renderBox() : '',
					this.inspection_id ? this.renderDate('date') : '',
					this.renderScope(),
					this.renderState(),
					this.renderNumber('occupancy'),
					this.renderSpecies(),
					this.renderNumber('eggs'),
					this.renderNumber('nestlings'),
					this.renderNestlingsAge(),
					this.renderNumber('nestlingsBanded'),
					this.renderNumber('clutchSize'),
					this.renderReasonForLoss(),
					this.renderPerpetrator(),
					this.renderDate('layingStart'), 
					this.renderDate('breedingStart'), 
					this.renderDate('hatchDate'),
					this.renderDate('bandingWindowStart'),
					this.renderDate('bandingWindowEnd'),
					i.occupancy || (i.maleBanded != null) ? this.renderParentBanding('maleBanded', 'Beringung Männchen') : '',
					i.occupancy || (i.femaleBanded != null) ? this.renderParentBanding('femaleBanded', 'Beringung Weibchen'): '',
					this.renderNote(),
					this.renderButtons(),
					this.renderPreviousInspection()
				]}
			</div>
			<app-dialog
				id="delete-dialog"
				primary="Abbrechen"
				secondary="Löschen"
				@secondary=${this.delete}
				discard="primary"
				head="Löschen"
			>
				<div>
					<span>Die Kontrolle des Nistkastens</span>
					<id-resolver id="delete-box-name" type="box" .value=${this.box_id}></id-resolver>
					<span>vom ${new Date(this.inspection.date).toLocaleDateString()} löschen?</span>
				</div>
      </app-dialog>
		`
	}
	renderHead(){
		const i = this.inspection
		return html`		
			<div class="head outside">
				<span class="box">
					<label for="box_id">Nistkasten&nbsp;</label>
					<id-resolver id="box" type="box" .value=${this.box_id}></id-resolver>

				</span>
				${this.inspection_id ? 
					html`<span>${new Date(this.inspection.date).toLocaleDateString()}</span>` :
					this.renderDate('date', '')
				}
			</div>
		`
	}
	renderEditWarning(){
		return html`
			<div class="editwarning outside">Bestehenden Eintrag ändern</div>
		`
	}
	renderMode(){
		return html`	
			<div class="mode outside">
				<label for="mode">Modus</label>
				<select id="mode" @change=${this.changeModeCb} .value=${this.mode}>
					<option value="MODE_CREATE">Neu eintragen</option>
					<option value="MODE_EDIT">Nachträglich ändern</option>
				</select>
				
			</div>
		`
	
	}
	renderScope(){
		return html`	
			<div class="scope outside">
				<label>Umfang</label>
				<select id="scope" .value=${this.inspection.scope} @change=${this.genericChangeCb}>
					<option value="SCOPE_INSIDE">Nistkasten inspiziert</option>
					<option value="SCOPE_OUTSIDE">Nur von außen</option>
				</select>
				
			</div>
		`
	
	}
	
	
	stateChangeCb(evt){
		const state = evt.target.value
		let i = this.inspection
		const {
			_id,
			type,
			_rev,
			box_id,
			date,
			note,
			scope,
			occupancy,
			species_id,
			clutchSize,
			layingStart,
			breedingStart,
			nestlingsBanded
		} = i
		const fixed = {_id, _rev, box_id, date, note, scope, type, occupancy}
		switch(state){
			case 'STATE_EMPTY':
			case 'STATE_NEST_BUILDING':
			case 'STATE_NEST_READY':
				this.inspection = {...fixed}
				break
			case 'STATE_EGGS':
				this.inspection = {
					...fixed,
					species_id,
					eggs: clutchSize || 1,
					occupancy: occupancy || (this.maxOccupancy + 1)
				}
				this.postProcess('eggs')
				break
			case 'STATE_BREEDING':
				this.inspection = {
					...fixed,
					species_id,
					eggs: clutchSize || 1,
					clutchSize: clutchSize || 1,
					layingStart,
					breedingStart: incDate(i.layingStart, i.clutchSize || 1),
					occupancy: occupancy || (this.maxOccupancy + 1)
				}
				break
			case 'STATE_SUCCESS':
			case 'STATE_NESTLINGS':
				this.inspection = {
					...fixed,
					species_id,
					layingStart,
					breedingStart,
					nestlingsBanded: nestlingsBanded || 0,
					eggs: 0,
					nestlings: clutchSize || 1,
					hatchDate: i.date,
					occupancy: occupancy || (this.maxOccupancy + 1)
				}
				this.postProcess('nestlings')
				this.postProcess('hatchDate')
				break
			case 'STATE_FAILURE':
				delete i.nestlings
				delete i.eggs
				i.reasonForLoss = 'UNKNOWN'
				break
		}
		this.inspection.state = state
		this.requestUpdate()
	}
	updateClutchSize(){
		const i = this.inspection
		i.clutchSize = Math.max(this.initialInspection.clutchSize || 0, (i.eggs || 0) + (i.nestlings || 0))
	}
	
	postProcess(key){
		const i = this.inspection
		switch(key){
			case 'eggs':
				this.guessLayingStart()
				this.updateClutchSize()
				break
			case 'nestlings':
				this.updateClutchSize()
				if(!this.initialInspection.breedingStart){
					i.breedingStart = incDate(i.hatchDate, -14)
				}
				if(!this.initialInspection.layingStart){
					i.layingStart = incDate(i.breedingStart, -i.clutchSize)
				}
				break
			case 'hatchDate':
				i.bandingWindowStart = incDate(i.hatchDate, bandingStartAge)
				i.bandingWindowEnd = incDate(i.hatchDate, bandingEndAge)
			case 'reasonForLoss':
				if((!i.reasonForLoss || i.reasonForLoss == 'UNKNOWN') && (i.state != 'STATE_OCCUPIED')){
					delete i.perpetrator_id
				}
		}
		this.requestUpdate()
	}
	guessLayingStart(){
		const i = this.inspection
		if(!this.initialInspection.eggs){
			i.layingStart = incDate(i.date, -i.eggs)
		}
	}
	genericChangeNumberCb(evt){
		const {id: key, value} = evt.target
		this.inspection[key] = Number(value)
		this.postProcess(key)
	}
	genericChangeCb(evt){
		const {id: key, value} = evt.target
		this.inspection[key] = value
		this.postProcess(key)
		
	}
	renderBox(){
		const i = this.inspection
		return html`		
			<div class="box_id outside">
				<label for="box_id">Nistkasten</label>
				<select-box
					buttons
					id="box_id" 
					.year=${this.year}
					.value=${this.box_id}
					@change=${this.genericChangeCb}
				></select-box>
			</div>
		`
	}
	renderState(){
		return html`
			<div class="state">
				<label for="state">Status</label>
				<select-state
					id="state"
					.value=${this.inspection.state}
					.lastValue=${this.previousInspection?.state}
					@change=${this.stateChangeCb}
				></select-state>
			</div>
		`
	}
	renderSpecies(){
		const { state, species_id } = this.inspection
		if(!species_id && !this.initialInspection.species_id && (
			(state == 'STATE_EMPTY') || 
			(state == 'STATE_OCCUPIED')
		)) return '' 
		return html`
			<div class="species_id">
				<label for="species_id">Vogelart</label>
				<select-item
					
					id="species_id"
					type="species"
					value=${species_id}
					@change=${this.genericChangeCb}
				></select-item>
			</div>
		`
	}
	renderPerpetrator(){
		const {state, perpetrator_id, reasonForLoss } = this.inspection
		const predation = (reasonForLoss == 'PREDATION')
		const label = translate(predation ? 'PREDATOR' : 'OCCUPATOR')
		if(!(
			state == 'STATE_OCCUPIED' ||
			perpetrator_id ||
			reasonForLoss == 'PREDATION'
		)) return '' 
		return html`
			<div class="perpetrator_id">
				<label for="perpetrator_id">${label}</label>
				<select-item
					emptyLabel=${translate('UNKNOWN')}
					id="perpetrator_id"
					type="perpetrator"
					value=${perpetrator_id}
					@change=${this.genericChangeCb}
				></select-item>
			</div>
		`
	}
	renderNumber(key, cb = this.genericChangeNumberCb){
		const i = this.inspection
		const value = i[key]
		if(value == null) return ''
		return html`
			<div class=${key}>
				<label for=${key}>${translate(`${i.state}.INSPECTION.${key}`)}</label>
				<select  id=${key} .value=${value} @change=${cb}>
					${[...Array(15)].map((_,idx) => html`
					<option .selected=${value == idx} value=${idx}>${idx}</option>	
					`)}
				</select>
			</div>
		`
	}
	renderNestlingsAge(){
		if(this.inspection.nestlings == null) return ''
		const iDateMs = new Date(this.inspection.date).getTime()
		const hDateMs = new Date(this.inspection.hatchDate).getTime()
		const value = (iDateMs - hDateMs) / (1000 * 60 * 60 * 24)
		return html`
			<div class="nestlingsAge">
				<label for="nestlingsAge">${translate('INSPECTION.NESTLINGSAGE')}</label>
				<span>
					<button @click=${() => this.incDate('hatchDate')}><</button>
					<span>${value}</span>
					<button @click=${() => this.decDate('hatchDate')}>></button>
				</span>
			</div>
		`
	}


	renderReasonForLoss(){
		const value = this.inspection.reasonForLoss
		if(this.inspection.state != 'STATE_FAILURE' && value == null) return ''
		return html`
			<div class="reasonForLoss">
				<label for="reasonForLoss">Grund für Verlust</label>
				<select  id="reasonForLoss" .value=${value} @change=${this.genericChangeCb}>
					<option value="UNKNOWN">${translate('UNKNOWN')}</option>
					<option value="PREDATION">${translate('PREDATION')}</option>
					<option value="PARENT_MISSING">${translate('PARENT_MISSING')}</option>
				</select>
			</div>
		`
	}
	renderDate(key, label = translate(key)){
		if(!this.dateVisible(key)) return ''
		let date = null
		const value = this.inspection[key]
		if(value) date = formatDateForInput(value)
		return html`
			<div class="date ${key}">
				<label for=${key}>${label}</label>
				<span>
					<button @click=${() => this.decDate(key)}><</button>
					<input id=${key} type="date" .value=${date} @change=${this.genericChangeCb}>
					<button @click=${() => this.incDate(key)}>></button>
				</span>
			</div>
		`
	}
	// needed for correcting faulty entries
	dateVisible(key){
		if(this.inspection[key]) return true
		const stateIdx = INSPECTION_STATES.indexOf(this.inspection.state)
		const gteNestlings = stateIdx > INSPECTION_STATES.indexOf('STATE_NESTLINGS')
		switch(key){
			case 'layingStart':
				return stateIdx > INSPECTION_STATES.indexOf('STATE_EGGS')
			case 'breedingStart':
				return this.inspection.layingStart && stateIdx > INSPECTION_STATES.indexOf('STATE_BREEDING')
			case 'hatchDate':
				return this.inspection.breedingStart && gteNestlings
			case 'bandingWindowStart':
				return this.inspection.hatchDate && gteNestlings
			case 'bandingWindowEnd':
				return this.inspection.bandingWindowStart && gteNestlings
			default:
				return false
		}
	}
	incDate(key){
		this.inspection[key] = incDate(this.inspection[key], 1)
		this.postProcess(key)
	}
	decDate(key){
		this.inspection[key] = incDate(this.inspection[key], -1)
		this.postProcess(key)
	}
	renderParentBanding(key, label){
		const value = this.value2option(this.inspection[key])
		return html`
			<div class=${key}>
				<label for=${key}>${label}</label>
				<select id=${key} .value=${value} @change=${this.changeParentBandingCb}>
					<option value="UNKNOWN">Unbekannt</option>
					<option value="YES">Ja</option>
					<option value="NO">Nein</option>
				</select>
			</div>
		`
	}
	value2option(value){
		switch(value){
			case true: return 'YES'
			case false: return 'NO'
			default: return 'UNKNOWN'
		}
	}
	changeParentBandingCb(evt){
		const i = this.inspection
		const {id, value} = evt.target
		switch(value){
			case 'UNKNOWN': delete i[id]; break 
			case 'YES': 		i[id] = true;	break
			case 'NO': 			i[id] = false; break
		}
		this.postProcess(id)
	}
	
	
	
	renderNote(){
		return html`
			<div class="note outside">
				<textarea
					id="note"
					placeholder="Bemerkung"
					.value=${this.inspection.note || ''}
					@input=${this.genericChangeCb}
				></textarea>
			</div>
		`
	}
				
	renderButtons(){
		return html`
			<div class="buttons">
				<button id="cancel" @click=${this.cancel}>Abbrechen</button>
				${this.inspection_id ? html`
					<button id="delete" @click=${this.confirmDeletion}>Löschen</button>
				` : ''}
				<button id="save" @click=${this.save}>Speichern</button>
			</div>
		`
	}
	cancel(){
		history.back()
	}
	confirmDeletion(){
		this.shadowRoot.querySelector('#delete-dialog').open = true
	}
	async delete(){
		this.shadowRoot.querySelector('#delete-dialog').open = false
		const response = await mcp.db().remove(this.inspection)
		if(response?.ok) history.back()
	}
	async save(){
		const response = await mcp.db().put(finalize(this.inspection))
		if(response.ok) history.back()
	}
	renderPreviousInspection(){
		if(!this.previousInspection) return ''
		return html`
			<div class="previousInspection">
				<label>Vorherige Inspektion</label>
				<view-inspection .inspection=${this.previousInspection}></view-inspection>
			</div>
		`
	}
	
	updated(changed){
		if(changed.has('inspection_id')) this.initEdit() 
		if(changed.has('box_id')) this.initCreate()
	}
	updateTainting(){
		let somethingTainted = false
		// remove all tainted, there might be some that are undefined 
		// in inspection *and* initialInspection, but were set in between
		this.shadowRoot
		.querySelectorAll('.tainted')
		.forEach(form => form.classList.remove('tainted'))
		if(!this.inspection) return
		// extrakt *all* keys, some might be missing in one or the other
		new Set([
			...Object.keys(this.inspection),
			...Object.keys(this.initialInspection)]
		)
		.forEach(key => {
			// find the form for the respective key
			const form = this.shadowRoot.querySelector(`.${key}`)
			if(form && this.inspection[key] != this.initialInspection[key]){
				form.classList.add('tainted')
				somethingTainted = true
			}
		})
		this.shadowRoot.querySelector('#save').disabled = !somethingTainted && this.mode == 'MODE_EDIT'
	}
	async initEdit(){
		const existingInspection = await mcp.db().get(this.inspection_id)
		this.initInspection(existingInspection)
		this.mode = 'MODE_EDIT'
		this.updateTainting()
	}
	async initCreate(){
		if(!this.year || this.year == currentYear){
			const existingInspection = await this.getInspectionByDate()
			if(existingInspection){
				this.initInspection(existingInspection)
				this.mode = 'MODE_EDIT'
			}
			else{
				this.createInspection()
			}
		}
		else{
			this.createInspection(`${this.year}-12-31`)
		}
		await this.fetchPreviousInspection()
		this.updateTainting()
	}
	
	async getInspectionByDate(date = new Date()){
		const response = await mcp.db()
		.query('upupa/inspections', {
			reduce: false,
			key: [
				new Date(date).getFullYear(),
				this.box_id,
				...dateToArr(date).slice(1)
			]
		})
		return response.rows[0]?.value
	}

	initInspection(source){
		this.initialInspection = source
		this.inspection = {...source}
	}

	async fetchPreviousInspection(){
		this.previousInspection = null
		this.maxOccupancy = 0
		const date = new Date(this.inspection.date)
		const dayBeforeArr = dateToArr(date.setDate(date.getDate()-1))
		const previousInspections = (
			await mcp.db()
			.query('upupa/inspections', {
				endkey: [dayBeforeArr[0], this.box_id, 0],
				startkey: [dayBeforeArr[0], this.box_id, dayBeforeArr[1], dayBeforeArr[2]],
				descending: true,
				inclusive_start: false,
				//limit:1
			})
			.then(({rows}) => rows.map(({key, value}) => value))
		)
		if(previousInspections.length){
			this.previousInspection = previousInspections[0]
			this.maxOccupancy = Math.max(...previousInspections.map(i => i.occupancy || 0))
		}
		this.updateInspection()
	}

	updateInspection(){
		
		if(this.inspection_id) return
		let date = new Date(this.inspection.date)
		if(this.year != currentYear && this.previousInspection){
			date = incDate(this.previousInspection.date, 7)
		}
		if(this.previousInspection && !isFinished(this.previousInspection)){
			this.initInspection({
				...this.previousInspection,
				date: date.toISOString(),
				note: undefined
			})
			delete this.inspection._id
			delete this.inspection._rev
			this.inspection.date = new Date(date).toISOString()
		}
		else{
			this.createInspection(date)
		}
	}
	createInspection(date = formatDateForInput(new Date())){
		this.initInspection({
			type: 'inspection',
			box_id: this.box_id,
			state: 'STATE_EMPTY',
			scope: 'SCOPE_INSIDE',
			date: new Date(date).toISOString()
		})
	}
	changeModeCb(evt){
		const {value} = evt.target
		switch(value){
			case 'MODE_CREATE':
				this.inspection.date = formatDateForInput(new Date())
				this.inspection_id = null
				setUrlParams({
					box_id: this.box_id
				})
				break
			case 'MODE_EDIT':
				this.inspection_id = this.previousInspection._id
				setUrlParams({
					inspection_id: this.previousInspection._id
				})
				break
		}
		this.mode = value
		this.requestUpdate()
	}
		
	renderInput(prop, type){
		return html`
			<div>
				<label for=${prop}>${this.getLabel(prop)}</label>
				<input type=${type} id=${prop} .value=${this.item[prop] || ''} @change=${this.changeCb}>
			</div>
		`
	}
	getLabel(prop){
		return translate(`INSPECTION.${prop.toUpperCase()}`)
	}
	changeDateCb(evt){
		this.inspection.date = evt.target.value
		// TODO: allow to shift existing inspection
		this.inspection_id = null
	}
	
	
	changeCb(evt){
		const { id, value } = evt.target
		this[id] = value
	}
	
}
function isFinished({state}){
	return state == 'STATE_FAILURE' || state == 'STATE_SUCCESS'
}
customElements.define('page-inspection', PageInspection)
