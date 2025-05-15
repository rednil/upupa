import { LitElement, html, css } from 'lit'
import './forms/select-id.js'

function getDateValue(date){
	return (date || '').split('T')[0]
}
export class BoxStatus extends LitElement {
  static get properties() {
    return {
      boxes: { type: Array },
			inspections: { type: Array },
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
				padding: 0.5em 0;
				border-radius: 5px;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
			}
			.inspection .date {
				font-weight: bold;
			}
			.summary > *, .title {
				display: flex;
				justify-content: space-between;
			}

			#select-box {
				flex: 1;
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
	}
	
  render() {
    return html`
			<div>
				<div class="title">
					<select-id id="select-box" class="bold" type="boxes" key="label" value=${this.box_id} autoselect @change=${this._boxSelectCb}></select-id>
					<button>Inspektion eintragen</button>
				</div>
				<div class="list">
					${this.summaries.map(({hatchDate, breedingStart, layingStart, species_id, occupancy, clutchSize }) => html`
						<div class="summary">
							<div><span>Belegung</span><span>${occupancy}</span></div>
							<select-id disabled type="species" key="name" value=${species_id}></select-id>
							<div><span>Gelegegröße</span><span>${clutchSize}</span></div>
							<div class="date"><label for="layingStart">Legebeginn</label><input id="layingStart" type="date" value=${getDateValue(layingStart)}></div>
							<div class="date"><label for="breedingStart">Brutbeginn</label><input id="breedingStart" type="date" value=${getDateValue(breedingStart)}></div>
							<div class="date"><label for="hatchDate">Schlüpfdatum</label><input id="hatchDate" type="date" value=${getDateValue(hatchDate)}></div>

							
						</div>
					`)}
					${this.inspections.map(({date, note, eggs, nestlings, state}) => html`
						<div class="inspection">
							<div class="date">${new Date(date).toLocaleDateString({}, {dateStyle: 'long'})}</div>
							<div>Status: ${state}</div>
							<div>Eier: ${eggs}</div>
							<div>Nestlinge: ${nestlings}</div>
							<div>Bemerkung: ${note}</div>
						</div>
					`)}
				</div>
			</div>
    `
  }

	async fetchBoxes(){
    const response = await fetch('/api/boxes')
    this.boxes = await response.json()
    await this._fetchInspections(this.boxes[0]._id)
  }
	_boxSelectCb(evt){
		const box_id = evt.target.value
		this._fetchInspections(box_id)
	}
	async _fetchInspections(box_id){
		const inspectionsResponse = await fetch(`/api/inspections?box_id=${box_id}`)
		const summariesResponse = await fetch(`/api/summaries?box_id=${box_id}`)
		const inspections = await inspectionsResponse.json()
		const summaries = await summariesResponse.json()
		this.inspections = inspections
		this.summaries = summaries 
	}
}

customElements.define('box-status', BoxStatus)
