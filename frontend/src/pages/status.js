import { LitElement, html, css } from 'lit'
import '../forms/select-id.js'
import { proxy } from '../proxy.js'
import { translate } from '../translator.js'

function getDateValue(date){
	return (date || '').split('T')[0]
}
function getShortDate(date){
	return new Date(date).toLocaleDateString(undefined, {day: "numeric", month: "numeric"})
}
export class PageStatus extends LitElement {
  static get properties() {
    return {
      //boxes: { type: Array },
			//inspections: { type: Array },
			box_id: { type: String }
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
				width: 100%;
			}
			:host > div {
				margin: 0 auto;
				display: flex;
				flex-direction: column;
				min-height: 0;
				width: 100%;
				max-width: 40em;
			}
			.inspection, .summary {
				padding: 0.5em;
				border-radius: 5px;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
			}
			.inspection .date, .summary .head {
				font-weight: bold;
			}
			.summary > *, .title, .inspection > * {
				display: flex;
				justify-content: space-between;
			}
			.head > * {
				flex: 1;
			}
			.head > *:nth-child(2){
				text-align: center;
			}
			.head > *:nth-child(3){
				text-align: right;
			}

			#select-box, button {
				margin: 0.5em;
			}
			
			.list {
				overflow-y: scroll;
				
			}
			
			
    `
  }
	constructor(){
		super()
		this.boxes = []
		this.inspections = []
		this.summaries = []
		this.species = []
	}
	
  render() {
    return html`
			<div>
				<div class="title">
					<select-id id="select-box" class="bold" type="boxes" key="label" .value=${this.box_id} autoselect @change=${this._boxSelectCb}></select-id>
					<button>Inspektion eintragen</button>
				</div>
				<div class="list">
					${this.summaries.map(summary => html`
						<div class="summary">
							<div class="head">
								<span>${summary.occupancy}. Belegung</span>
								<span>${this.getSpeciesName(summary.species_id)}</span>
								<span>${translate(summary.state)}</span>
							</div>
							<div><span>Gelegegröße</span><span>${summary.clutchSize}</span></div>
							<div><span>Nestlinge beringt</span><span>${summary.nestlingsBanded}</span></div>
							<div class="date"><label for="layingStart">Legebeginn</label><input id="layingStart" type="date" value=${getDateValue(summary.layingStart)}></div>
							<div class="date"><label for="breedingStart">Brutbeginn</label><input id="breedingStart" type="date" value=${getDateValue(summary.breedingStart)}></div>
							<div class="date"><label for="hatchDate">Schlüpfdatum</label><input id="hatchDate" type="date" value=${getDateValue(summary.hatchDate)}></div>
							${summary.hatchDate ? html`
								<div><span>Beringungszeitfenster</span><span>${getShortDate(summary.bandingWindowStart)}-${getShortDate(summary.bandingWindowEnd)}</span></div>	
							`:''}
							<div><span>Weibchen beringt</span><span>${summary.femaleBanded ? 'ja' : 'nein'}</span></div>
							<div><span>Männchen beringt</span><span>${summary.maleBanded ? 'ja' : 'nein'}</span></div>
							${summary.state == 'STATE_FAILURE' ? html`
								<div><span>Grund für Misserfolg</span><span>${summary.reasonForFailure}</span></div>
								<div><span>Prädator</span><span>${summary.predator}</span></div>
							`:''}
						</div>
					`)}
					${this.inspections.map(({date, note, eggs, nestlings, state, species_id}) => html`
						<div class="inspection">
							<div class="head">
								<span class="date">${new Date(date).toLocaleDateString({}, {dateStyle: 'long'})}</span>
								<span>${this.getSpeciesName(species_id)}</span>
								<span>${translate(state)}</span>
							</div>
							<div><span>Anzahl Eier</span><span>${eggs}</span></div>
							<div><span>Anzahl Nestlinge</span><span>${nestlings}</span></div>
							<div>Bemerkung: ${note}</div>
						</div>
					`)}
				</div>
			</div>
    `
  }
	getSpeciesName(species_id){
		return this.species.find(species => species._id == species_id)?.name || '---'
	}
	firstUpdated(){
		if(this.box_id){
			this._fetchData(this.box_id)
		}
	}
	
	_boxSelectCb(evt){
		this.box_id = evt.target.value
		history.replaceState({},null,`#/status?box_id=${this.box_id}`)
		this._fetchData(this.box_id)
	}
	async _fetchData(box_id){
		var [inspections, summaries, species, boxes] = await proxy.fetch([
			{path: 'inspections', query: { box_id }},
			{path: 'summaries', query: { box_id }},
			{path: 'species'},
			{path: 'boxes'}
		])
		Object.assign(this, {inspections, summaries, species, boxes})
		this.requestUpdate()
	}
}

customElements.define('page-status', PageStatus)
