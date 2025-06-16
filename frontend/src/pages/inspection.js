import { LitElement, html,css } from 'lit'
import {live} from 'lit/directives/live.js'
import { translate } from '../translator'
import { Proxy } from '../proxy'
import '../forms/select-item.js'
import '../forms/select-state.js'
import '../components/inspection-display.js'

const formatDateForInput = date => date ? new Date(date).toISOString().split('T')[0] : null
const dateToArr = date => formatDateForInput(date).split('-').map(x => Number(x))

const events = ['layingStart', 'breedingStart', 'hatchDate']

export class PageInspection extends LitElement {
	static get properties() {
		return {
			box_id: { type: String },
			inspection_id: { type: String },
			lastInspection: { type: Object },
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
				padding: 0.5em;
				
			}
			.mode {
				display: flex;
				justify-content: space-around;
			}
			.mode > div {
				display: flex;
				padding: 0.5em 0;
			}
			.editor > div {
				display: flex;
				justify-content: space-between;
				padding: 0.5em 0;
			}
			
			.banding > span {
				display: flex;
			}
			
			.buttons {
				display: flex;
				justify-content: space-between;
			}
			textarea {
				flex: 1;
			}
			button {
				margin: 1em 0;
			}
		`
	}
	/*
			.editor .state,
			.editor .species_id,
			.editor .note,
			.editor .head {
				display: flex;
			}
			.STATE_OCCUPIED .perpetrator_id {
				display: flex;
			}
			.STATE_OCCUPIED .species_id {
				display: none;
			}
			.STATE_EGGS .eggs,
			.STATE_EGGS .clutchSize,
			.STATE_EGGS .layingStart,
			.STATE_EGGS .banding.parents {
				display: flex;
			}
			.STATE_BREEDING .eggs,
			.STATE_BREEDING .clutchSize,
			.STATE_BREEDING .layingStart,
			.STATE_BREEDING .breedingStart,
			.STATE_BREEDING .banding.parents
			{
				display: flex;
			}
			.STATE_NESTLINGS .eggs,
			.STATE_NESTLINGS .clutchSize,
			.STATE_NESTLINGS .layingStart,
			.STATE_NESTLINGS .breedingStart,
			.STATE_NESTLINGS .hatchDate,
			.STATE_NESTLINGS .nestlings,
			.STATE_NESTLINGS .nestlingsAge,
			.STATE_NESTLINGS .banding
			{
				display: flex;
			}
			.STATE_SUCCESS .eggs,
			.STATE_SUCCESS .clutchSize,
			.STATE_SUCCESS .layingStart,
			.STATE_SUCCESS .breedingStart,
			.STATE_SUCCESS .hatchDate,
			.STATE_SUCCESS .nestlings,
			.STATE_SUCCESS .banding
			{
				display: flex;
			}

		`
	}
		*/
	constructor(){
		super()
		this.lastInspection = {}
		this.inspection = {
			date: formatDateForInput(new Date())
		}
		this.mode = 'CREATE'
		this.summary = {}
		//this.date = formatDateForInput(new Date())
		this.proxy = new Proxy(this)
	}
	
	render() {
		
		return html`
			<div class="${this.inspection.state}">
				${[
					this.renderMode(),
					this.renderEditor(),
					this.renderButtons(),
					this.lastInspection ? this.renderLastInspection() : ''
				]}
			</div>
		`
	}
	renderMode(){
		return html`	
			<div class="mode">
				<div>
					<input 
						type="radio"
						.checked=${this.mode == 'EDIT'}
						@change=${this.changeModeCb}
						name="mode"
						value="EDIT"
					>
					<label for="html">Bestehende ändern</label>
				</div>
				<div>
					<input
						type="radio"
						.checked=${this.mode == 'CREATE'}
						@change=${this.changeModeCb}
						name="mode"
						value="CREATE"
					>
					<label for="css">Neue eintragen</label>
				</div>
			</div>
		`
	}
	
	renderEditor(){
		const i = this.inspection
		return html`
			<div class="editor">
			${[
				this.renderHead(),
				i.state ? this.renderState() : '',
				(
					(i.state != 'STATE_EMPTY') && 
					(i.state != 'STATE_OCCUPIED')
				) ||
				i.species_id ? this.renderSpecies() : '',
				this.renderNumber('eggs'),
				this.renderNumber('clutchSize'),
				this.renderNumber('nestlings'),
				this.renderNumber('nestlingsAge'),
				this.renderReasonForLoss(),
				this.renderPerpetrator(),
				this.renderEvent('layingStart'), 
				this.renderEvent('breedingStart'), 
				this.renderEvent('hatchDate'),
				i.occupancy || (i.maleBanded != null) ? this.renderParentBanding('maleBanded', 'Beringung Männchen') : '',
				i.occupancy || (i.maleBanded != null) ? this.renderParentBanding('femaleBanded', 'Beringung Weibchen'): '',
				(i.state == 'STATE_NESTLINGS') || i.nestlingsBanded ? this.renderNumber('nestlingsBanded') : '',
				this.renderNote()
			]}
			</div>
		`
	}
	renderHead(){
		const i = this.inspection
		return html`		
			<div class="head">
				<select-item 
					id="select-box" 
					class="bold"
					type="box"
					.value=${this.box_id}
					.autoselect=${!this.inspection_id}
					@change=${this.boxSelectCb}
				></select-item>
				<input id="date" type="date" .value=${formatDateForInput(i.date)} @change=${this.changeDateCb}> 
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
					.lastValue=${this.lastInspection.state}
					@change=${this.stateChangeCb}
				></select-state>
			</div>
		`
	}
	renderSpecies(){
		return html`
			<div class="species_id">
				<label for="species_id">Vogelart</label>
				<select-item
					id="species_id"
					type="species"
					value=${this.inspection.species_id}
				></select-item>
			</div>
		`
	}
	renderPerpetrator(){
		const value = this.inspection.perpetrator_id
		if(value == null) return ''
		return html`
			<div class="perpetrator_id">
				<label for="perpetrator_id">Eindringling</label>
				<select-item
					id="perpetrator_id"
					type="perpetrator"
					value=${value}
				></select-item>
			</div>
		`
	}
	renderNumber(key){
		const value = this.inspection[key]
		if(value == null) return ''
		return html`
			<div class=${key}>
				<label for=${key}>${translate('INSPECTION.'+key)}</label>
				<input id=${key} type="number" value=${value} @change=${this.genericChangeCb}>
			</div>
		`
	}
	renderReasonForLoss(){
		const value = this.inspection.reasonForLoss
		if(value == null) return ''
		return html`
			<div class="reasonForLoss">
				<label for="reasonForLoss">Grund für Verlust</label>
				<select>
					<option value="UNKNOWN">${translate('UNKNOWN')}</option>
					<option value="PREDATION">${translate('PREDATION')}</option>
					<option value="PARENT_MISSING">${translate('PARENT_MISSING')}</option>
				</select>
			</div>
		`
	}
	renderEvent(key){
		const value = formatDateForInput(this.inspection[key])
		if(value == null) return ''
		return html`
			<div class=${key}>
				<label for=${key}>${translate(key)}</label>
				<input id=${key} type="date" .value=${value}>
			</div>
		`
	}
	renderParentBanding(key, label){
		const value = this.value2option(this.inspection[key])
		return html`
			<div>
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
	changeParentCb(evt){
		const i = this.inspection
		const {id, value} = evt.target
		switch(value){
			case 'UNKNOW': return delete i[id] 
			case 'YES': return i[id] = true
			case 'NO': return i[id] = false
		}
	}
	
	renderBandingParents(){
		const i = this.inspection
		return html`
			<div class="banding parents">
				<span>Beringung Altvögel</span>
				<span>
					<span>
						<input type="checkbox" .checked=${i.maleBanded} >
						<span>M</span>
					</span>
					<span>
						<input type="checkbox" .checked=${i.femaleBanded} >
						<span>W</span>
					</span>
				</span>
			</div>
		`
	}
	
	renderNote(){
		return html`
			<div class="note">
				<textarea placeholder="Bemerkung"></textarea>
			</div>
		`
	}
				
	renderButtons(){
		return html`
			<div class="buttons">
				<button>Abbrechen</button>
				<button>Speichern</button>
			</div>
		`
	}
	renderLastInspection(){
		return html`
			<div class="lastInspection">
				<div>Vorherige Inspektion</div>
				<inspection-display .inspection=${this.lastInspection}></inspection-display>
			</div>
		`
	}
	updated(changedProps){
		console.log('updated', changedProps)
		;['lastInspection', 'inspection', 'box_id', 'inspection_id']
		.map(str => console.log(str, this[str]))
		
		if(
			(changedProps.has('inspection_id') && this.inspection._id != this.inspection_id) ||
			(changedProps.has('box_id') && this.inspection.box_id != this.box_id) 
			//changedProps.has('date')
		){
			this.fetchInspection()
		}
	}
	async fetchInspection(){
		console.log('fetchInspection', this.inspection_id)
		delete this.lastInspection
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
			this.inspection = existingInspection
			this.inspection_id = this.inspection._id
			this.box_id = this.inspection.box_id
			//this.date = this.inspection.date
			this.mode = 'EDIT'
		}
		await this.fetchLastInspection()
	}

	async fetchLastInspection(){
		console.log('fetchLastInspection', this.inspection.date)
		const date = new Date(this.inspection.date)
		const dayBeforeArr = dateToArr(date.setDate(date.getDate()-1))
		
		this.lastInspection = (await this.proxy.queryReduce('inspections', {
			endkey: [dayBeforeArr[0], this.box_id, 0],
			startkey: [dayBeforeArr[0], this.box_id, dayBeforeArr[1], dayBeforeArr[2]],
			descending: true,
			inclusive_start: false,
			limit:1
		}))[0]
		console.log('lastInspection', this.lastInspection)
		this.updateInspection()
	}
	stateChangeCb(evt){
		const state = evt.target.value
		let i = this.inspection
		switch(state){
			case 'STATE_EMPTY':
				const {_id, _rev, box_id, date, note} = i
				this.inspection = i = {_id, _rev, box_id, date, note}

		}
		i.state = state
	}
	genericChangeCb(evt){
		console.log('genericChangeCb', evt.target.id, evt.target.value)
		this.inspection[evt.target.id] = evt.target.value
		this.requestUpdate()
	}
	changeModeCb(evt){
		console.log('changeMode', evt.target.value)
		switch(evt.target.value){
			case 'CREATE':
				this.inspection.date = formatDateForInput(new Date())
				this.inspection_id = null
				history.replaceState({},null,`#/inspection?box_id=${this.box_id}`)
				break
			case 'EDIT':
				history.replaceState({},null,`#/inspection?inspection_id=${this.lastInspection._id}`)
				break
		}
	}
	boxSelectCb(evt){
		console.log('boxSelectCb', evt.target.value)
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
	
	
	updateInspection(){
		const date = this.inspection.date
		if(this.inspection_id) return
		if(this.lastInspection && !isFinished(this.lastInspection)){
			this.inspection = {...this.lastInspection}
			delete this.inspection._id
		}
		else{
			this.inspection = {
				box_id: this.box_id,
				state: 'STATE_EMPTY'
			}
		}
		
		this.inspection.date = date
		
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
