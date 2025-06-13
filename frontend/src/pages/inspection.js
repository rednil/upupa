import { LitElement, html,css } from 'lit'
import { translate } from '../translator'
import { Proxy } from '../proxy'
import '../forms/select-item.js'
import '../forms/select-state.js'
import '../components/inspection-display.js'

const formatDateForInput = date => new Date(date).toISOString().split('T')[0]
const events = ['layingStart', 'breedingStart', 'hatchDate']

export class PageInspection extends LitElement {
	static get properties() {
		return {
			box_id: { type: String },
			inspection_id: { type: String },
			date: { type: String }
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
			.editor > div {
				display: none;
				justify-content: space-between;
				padding: 0.5em 0;
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
			.STATE_EGGS .layingStart {
				display: flex;
			}
			.STATE_BREEDING .eggs,
			.STATE_BREEDING .layingStart,
			.STATE_BREEDING .breedingStart {
				display: flex;
			}
		`
	}
	constructor(){
		super()
		this.lastInspection = {}
		this.inspection = {}
		this.summary = {}
		this.date = formatDateForInput(new Date())
		this.proxy = new Proxy(this)
	}
	
	render() {
		const i = this.inspection
		const s = this.summary || {}
		
		return html`
		<div class="${i.state}">
			<div class="editor">
				<div class="head">
					<select-item id="select-box" class="bold" type="box" .value=${this.box_id} autoselect @change=${this.boxSelectCb}></select-item>
					<input id="date" type="date" .value=${i.date} @change=${this.changeDateCb}> 
				</div>
				<div class="state">
					<label for="state">Status</label>
					<select-state id="state" .value=${i.state} .summaryValue=${s.state} @change=${this.genericChangeCb}></select-state>
				</div>
				<div class="species_id">
					<label for="species_id">Vogelart</label>
					<select-item id="species_id" type="species" value=${i.species_id}></select-item>
				</div>
				<div class="perpetrator_id">
					<label for="perpetrator_id">Eindringling</label>
					<select-item id="perpetrator_id" type="perpetrator" value=${i.perpetrator_id}></select-item>
				</div>
				<div class="eggs">
					<label for="eggs">Anzahl Eier</label>
					<input id="eggs" type="number" value="${i.eggs}">
				</div>
				<div class="nestlings">
					<label for="nestlings">Anzahl lebender Nestlinge</label>
					<input id="nestlings" type="number" value="${i.nestlings}">
				</div>
				${this.nestlings ? html`
					<div class="nestlingsAge">
						<label for="nestlingsAge">Alter der Nestlinge</label>
						<input id="nestlingsAge" type="number" value="${i.nestlingsAge}">
					</div>
				`: ''}
				<div class="reasonForLoss">
					<label for="reasonForLoss">Grund für Verlust</label>
					<select>
						<option value="UNKNOWN">${translate('UNKNOWN')}</option>
						<option value="PREDATION">${translate('PREDATION')}</option>
						<option value="PARENT_MISSING">${translate('PARENT_MISSING')}</option>
					</select>
				</div>
				<div class="layingStart">
					<label for="layingStart">Legebeginn</label>
					<input id="layingStart" type="date" value="${i.layingStart}">
				</div>
				<div class="breedingStart">
					<label for="breedingStart">Brutbeginn</label>
					<input id="breedingStart" type="date" value="${i.breedingStart}">
				</div>
				<div class="hatchDate">
					<label for="hatchDate">Schlüpfdatum</label>
					<input id="hatchDate" type="date" value="${i.hatchDate}">
				</div>
				<div class="banding">
					<span>Beringung</span>
					<span>
						<span>
							<input type="checkbox" .checked=${i.maleBanded} .disabled=${s.maleBanded}>
							<span>M</span>
						</span>
						<span>
							<input type="checkbox" .checked=${i.femaleBanded} .disabled=${s.femaleBanded}>
							<span>W</span>
						</span>
						<span>
							<input type="checkbox" .checked=${i.nestlingsBanded} .disabled=${s.nestlingsBanded}>
							<span>N</span>
						</span>
					</span>
				</div>
				<div class="note">
					<textarea placeholder="Bemerkung"></textarea>
				</div>
			</div>
			<div class="buttons">
				<button>Abbrechen</button>
				<button>Speichern</button>
			</div>
			${this.lastInspection?html`
				<div class="lastInspection">
					<div>Letzte Inspektion</div>
					<inspection-display .inspection=${this.lastInspection}></inspection-display>
				</div>
			`:''}
				
		</div>
		`
	}
	updated(changedProps){
		console.log('updated', changedProps)
		;['lastInspection', 'inspection', 'box_id', 'inspection_id']
		.map(str => console.log(str, this[str]))
		
		if(
			changedProps.has('inspection_id') ||
			changedProps.has('box_id') ||
			changedProps.has('date')
		){
			this.fetchInspection()
		}
	}
	genericChangeCb(evt){
		console.log('genericChangeCb', evt.target.id, evt.target.value)
		this.inspection[evt.target.id] = evt.target.value
		this.requestUpdate()
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
	async fetchLastInspection(){
		console.log('fetchLastInspection')
		this.lastInspection = await this.proxy.queryReduce('inspections', {
			group: true,
			group_level: 2,
			key: [2025, this.box_id],
		})
		console.log('lastInspection', this.lastInspection)
		this.updateInspection()
	}
	
	updateInspection(){
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
		this.inspection.date = this.date
		
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
	async fetchInspection(){
		console.log('fetchInspection', this.inspection_id)
		delete this.lastInspection
		delete this.summary
		//if(this.inspection_id && (this.inspection_id == this.inspection._id)) return
		const existingInspection = this.inspection_id ? 
			await this.proxy.db.get(this.inspection_id) :
			await this.proxy.query('inspection', {
				key: [2025, this.box_id, ...formatDateForInput(this.inspection.date).split('-').slice(1)]
			})
		if(existingInspection){
			this.inspection = existingInspection
			this.inspection_id = this.inspection._id
			this.date = this.inspection.date
		}
		await this.fetchLastInspection()
	}
	
	changeCb(evt){
		const { id, value } = evt.target
		this[id] = value
	}
	
}

customElements.define('page-inspection', PageInspection)
