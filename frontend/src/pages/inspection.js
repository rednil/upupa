import { LitElement, html,css } from 'lit'
import {live} from 'lit/directives/live.js'
import { translate } from '../translator'
import { Proxy } from '../proxy'
import '../forms/select-item.js'
import '../forms/select-state.js'
import '../components/inspection-display.js'
import { incDate } from './calendar.js'
import { Page } from './base.js'

const bandingStartAge = 7
const bandingEndAge = 12

const formatDateForInput = date => date ? new Date(date).toISOString().split('T')[0] : null
const dateToArr = date => formatDateForInput(date).split('-').map(x => Number(x))

const events = ['layingStart', 'breedingStart', 'hatchDate']

export class PageInspection extends Page {
	static get properties() {
		return {
			box_id: { type: String },
			inspection_id: { type: String },
			previousInspection: { type: Object },
			inspection: { type: Object }
			//date: { type: String }
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
			:host > div.SCOPE_OUTSIDE > .date {
				display: flex;
			}
			.previousInspection {
				flex-direction: column;
			}
		`
	}
	
	constructor(){
		super()
		this.previousInspection = {}
		this.createInspection()
		this.mode = 'MODE_CREATE'
		this.summary = {}
		//this.date = formatDateForInput(new Date())
		this.proxy = new Proxy(this)
	}
	
	render() {
		const i = this.inspection
		return html`
			<div class="${this.inspection.state} ${this.mode} ${this.inspection.scope}">
				${[
					//this.renderMode(),
					this.renderHead(),
					this.inspection_id ? this.renderEditWarning() : '',
					this.inspection_id ? this.renderBox() : '',
					this.inspection_id ? this.renderDate('date') : '',
					this.renderScope(),
					i.state ? this.renderState() : '',
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
					i.occupancy || (i.maleBanded != null) ? this.renderParentBanding('femaleBanded', 'Beringung Weibchen'): '',
					this.renderNote(),
					this.renderButtons(),
					this.renderPreviousInspection()
				]}
			</div>
		`
	}
	renderHead(){
		const i = this.inspection
		return html`		
			<div class="head outside">
				<span class="box">
					<label for="box_id">Nistkasten&nbsp;</label>
					<select-item
						readonly
						id="box"
						type="box"
						.value=${this.box_id}
					></select-item>
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
			_rev,
			box_id,
			date,
			note,
			scope,
			species_id,
			eggs,
			clutchSize,
			layingStart,
			breedingStart,
			nestlingsBanded
		} = i
		const fixed = {_id, _rev, box_id, date, note, scope}
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
					eggs: clutchSize || 1
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
					breedingStart: incDate(i.layingStart, i.clutchSize || 1)
				}
				break
			case 'STATE_NESTLINGS':
				this.inspection = {
					...fixed,
					species_id,
					layingStart,
					breedingStart,
					nestlingsBanded: nestlingsBanded || 0,
					eggs: 0,
					nestlings: clutchSize || 1,
					hatchDate: i.date
				}
				this.postProcess('nestlings')
				this.postProcess('hatchDate')
				break
			case 'STATE_FAILURE':
				delete i.nestlings
				delete i.eggs
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
		console.log('change', key, value)
		this.inspection[key] = value
		this.postProcess(key)
		
	}
	renderBox(){
		const i = this.inspection
		return html`		
			<div class="box_id outside">
				<label for="box_id">Nistkasten</label>
				<select-item
					buttons
					id="box_id" 
					type="box"
					.value=${this.box_id}
					@change=${this.genericChangeCb}
				></select-item>
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
					.lastValue=${this.previousInspection.state}
					@change=${this.stateChangeCb}
				></select-state>
			</div>
		`
	}
	renderSpecies(){
		const { state, species_id } = this.inspection
		if(!species_id && (
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
		if(value == null) return ''
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
		const value = this.inspection[key]

		if(value == null) return ''
		const date = formatDateForInput(value)
		
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
				<button id="save" @click=${this.save}>Speichern</button>
			</div>
		`
	}
	cancel(){
		history.back()
		//this.inspection = {...this.initialInspection}
	}
	async save(){
		const response = await this.proxy.put(this.inspection)
		
	}
	renderPreviousInspection(){
		if(!this.previousInspection) return ''
		return html`
			<div class="previousInspection">
				<label>Vorherige Inspektion</label>
				<inspection-display .inspection=${this.previousInspection}></inspection-display>
			</div>
		`
	}
	updated(changedProps){
		if(
			(changedProps.has('inspection_id') && this.inspection._id != this.inspection_id) ||
			(changedProps.has('box_id') && this.inspection.box_id != this.box_id) 
		){
			this.fetchInspection()
		}
		this.updateTainting()
	}
	updateTainting(){
		let somethingTainted = false
		// remove all tainted, there might be some that are undefined 
		// in inspection *and* initialInspection, but were set in between
		this.shadowRoot
		.querySelectorAll('.tainted')
		.forEach(form => form.classList.remove('tainted'))
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
	async fetchInspection(){
		delete this.previousInspection
		delete this.summary
		//if(this.inspection_id && (this.inspection_id == this.inspection._id)) return
		const existingInspection = this.inspection_id ? 
			await this.proxy.db.get(this.inspection_id) :
			(await this.proxy.queryReduce('inspections', {
				reduce: false,
				key: [2025, this.box_id, ...dateToArr(this.inspection.date).slice(1)]
			}))[0]
		console.log('existingInspection',existingInspection)
		if(existingInspection){
			this.initInspection(existingInspection)
			this.inspection_id = this.inspection._id
			this.box_id = this.inspection.box_id
			//this.date = this.inspection.date
			this.mode = 'MODE_EDIT'
		}
		await this.fetchPreviousInspection()
	}

	initInspection(source){
		this.initialInspection = source
		this.inspection = {...source}
	}

	async fetchPreviousInspection(){
		const date = new Date(this.inspection.date)
		const dayBeforeArr = dateToArr(date.setDate(date.getDate()-1))
		
		this.previousInspection = (await this.proxy.queryReduce('inspections', {
			endkey: [dayBeforeArr[0], this.box_id, 0],
			startkey: [dayBeforeArr[0], this.box_id, dayBeforeArr[1], dayBeforeArr[2]],
			descending: true,
			inclusive_start: false,
			limit:1
		}))[0]
		console.log('previousInspection', this.previousInspection)
		this.updateInspection()
	}

	updateInspection(){
		const date = this.inspection.date
		if(this.inspection_id) return
		if(this.previousInspection && !isFinished(this.previousInspection)){
			this.initInspection({
				...this.previousInspection,
				date,
				note: undefined
			})
			delete this.inspection._id
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
				history.replaceState({},null,`#/inspection?box_id=${this.box_id}`)
				break
			case 'MODE_EDIT':
				this.inspection_id = this.previousInspection._id
				history.replaceState({},null,`#/inspection?inspection_id=${this.previousInspection._id}`)
				break
		}
		this.mode = value
		this.requestUpdate()
	}
	boxSelectCb(evt){
		this.box_id = evt.target.value
		this.inspection_id = null
		/*
		this.inspection = {
			date: this.inspection.date,
			box_id: this.box_id
		}
		*/
		history.replaceState({},null,`#/inspection?box_id=${this.box_id}`)
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
