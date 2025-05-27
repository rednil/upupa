import { LitElement, html,css } from 'lit'
import { translate } from '../translator'
import { Proxy } from '../proxy'
import '../forms/select-item.js'
import '../forms/select-state.js'

const formatDateForInput = date => new Date(date).toISOString().split('T')[0]
const events = ['layingStart', 'breedingStart', 'hatchDate']

export class PageInspection extends LitElement {
	static get properties() {
		return {
			box_id: { type: String },
			inspection_id: { type: String },
			date: { type: String },
			lastInspection: { type: Object },
			inspection: { type: Object }
		}
	}
	static get styles() {
		return css`
			:host  {
				flex: 1;
			}
			:host > div {
				min-height: 0;
			}
			:host > div > div {
				max-width: 40em;
				margin: 0 auto;
				padding: 0.5em;
			}
			.editor > div {
				display: flex;
				justify-content: space-between;
				padding: 0.2em 0;
			}
			textarea {
				flex: 1;
			}
		`
	}
	constructor(){
		super()
		this.lastInspection = {}
		this.date = formatDateForInput(new Date())
		this.inspection = {}
		this.proxy = new Proxy(this)
	}
	
	render() {
		const { 
			species_id, 
			eggs, 
			nestlings, 
			state, 
			layingStart, 
			breedingStart, 
			hatchDate,
			nestlingsBanded,
			femaleBanded,
			maleBanded
		} = this.inspection 
		return html`
		<div>
			<div class="editor">
				<div>
					<select-item id="select-box" class="bold" collection="boxes" .value=${this.box_id} autoselect @change=${this.boxSelectCb}></select-item>
					<input id="date" type="date" .value=${this.date} @change=${this.changeDateCb}> 
				</div>
				
				<div>
					<label for="state">Status</label>
					<select-state id="state" .value=${state}></select-state>
				</div>
				<div>
					<label for="species_id">Vogelart</label>
					<select-item id="species_id" collection="species" value=${species_id}></select-item>
				</div>
				<div>
					<label for="eggs">Anzahl Eier</label>
					<input id="eggs" type="number" value="${eggs}">
				</div>
				<div>
					<label for="nestlings">Anzahl Nestlinge</label>
					<input id="nestlings" type="number" value="${nestlings}">
				</div>
				<div>
					<label for="layingStart">Legebeginn</label>
					<input id="layingStart" type="date" value="${layingStart}">
				</div>
				<div>
					<label for="layingStart">Brutbeginn</label>
					<input id="layingStart" type="date" value="${breedingStart}">
				</div>
				<div>
					<label for="layingStart">Schlüpfdatum</label>
					<input id="layingStart" type="date" value="${hatchDate}">
				</div>
				<div>
					<label for="nestlingsBanded">Nestlinge beringt</label>
					<input id="nestlingsBanded" type="checkbox" value="${nestlingsBanded}">
				</div>
				<div>
					<label for="femaleBanded">Weibchen beringt</label>
					<input id="femaleBanded" type="checkbox" value="${femaleBanded}">
				</div>
				<div>
					<label for="maleBanded">Männchen beringt</label>
					<input id="maleBanded" type="checkbox" value="${maleBanded}">
				</div>
				<div>
					<textarea placeholder="Bemerkung"></textarea>
				</div>
				
				<div>
					<button>Abbrechen</button>
					<button>Speichern</button>
				</div>
				<div><label for="">Letzte Inspektion</label><span>${this.lastInspection?.date}</span></div>
				<div>${this.lastInspection?.note}</div>
			</div>
		</div>
		`
	}
	updated(changedProps){
		if(changedProps.has('inspection_id')){
			this.fetchInspection()
		}
		else if(changedProps.has('box_id' || changedProps.has('date'))){
			this.fetchLastInspection()
		}
	}
	boxSelectCb(evt){
		console.log('boxSelectCb', evt.target.value)
		this.box_id = evt.target.value
	}
	async fetchLastInspection(){
		console.log('fetchLastInspection')
		this.lastInspection = await this.proxy.fetchSingle(
			'inspections',
			`box_id=${this.box_id}`,
			`date=$lte:${this.date}`,
			'$sort=date:-1',
			'$limit=1',
		)
		if(this.lastInspection){			
			this.summary = await this.proxy.fetchSingle(
				'summaries',
				`box_id=${this.box_id}`,
				`lastInspection=$gte:${this.lastInspection.date}`,
				'$sort=occupancy:-1'

			)
			this.inspection = {...this.lastInspection}
			console.log('summary', this.summary)
			events.forEach(event => {
				if(this.summary[event]){
					console.log('assign')
					this.inspection[event] = formatDateForInput(this.summary[event])
				}
			})
			
		}
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
	changeDateCb(){

	}
	
	changeCb(evt){
		const { id, value } = evt.target
		this[id] = value
	}
	
}

customElements.define('page-inspection', PageInspection)
