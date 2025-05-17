import { LitElement, html, css } from 'lit'
import { proxy } from '../proxy'

import '../components/box-map'
import '../components/box-list'
import {translate} from '../translator'

const infoOptions = [
	'BOXES',
	'STATUS',
	'LAST_INSPECTION',
	'BAND_STATUS_NESTLINGS',
	'BAND_STATUS_FEMALE'
]

export class PageOverview extends LitElement {
  static get properties() {
    return {
      boxes: { type: Array },
			box_id: { type: String },
			info: { type: String },
			mode: { type: String }
    }
  }

  static get styles() {
    return [
			css`
		  :host {
        display: flex;
        flex-direction: column;
				width: 100%;
			}
			#map, #list {
				flex: 1;
				width: 100%;
			}
			.selected {
				border: 2px solid red;
			}
			select {
				width: fit-content;
				padding: 0.5em 0;
				direction: rtl;
				text-align: left;
				border: 0;
			}
			select option {
				direction: ltr;
			}
			.controls {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
			}
			.mode input, .mode label {
				margin: auto;
			}
			.mode label {
				padding: 0 0.5em;
			}
			.mode{
				display: flex;
			}
			box-list{
				padding: 0.5em;
			}
    `]
  }
	constructor(){
		super()
		this.boxes = []
		this.info = 'BOXES'
		this.mode = 'MAP'
		this.fetchData()
	}
	
  render() {
		console.log('overview render', this.mode, this.mode == 'MAP')
    return html`
			${this.mode == 'MAP' ? html`
				<box-map class=${this.mode} id="map" .boxes=${this.boxes} info=${this.info} box_id=${this.box_id}></box-map>
			`: html`
				<box-list class=${this.mode} id="list" .boxes=${this.boxes} info=${this.info}></box-list>
			`}
			<div class=controls>
				<select @change=${this.infoChangeCb}>
					${infoOptions.map(option => html`
						<option value=${option}>${translate(option)}</option>
					`)}
				</select>
				<div class="mode">
					<input type="radio" .checked=${this.mode == 'MAP'} @change=${this.changeModeCb} name="mode" value="MAP">
					<label for="html">Karte</label>
					<input type="radio" .checked=${this.mode == 'LIST'} @change=${this.changeModeCb} name="mode" value="LIST">
					<label for="css">Liste</label>
				</div>
			</div>
    `
  }
	changeModeCb(evt){
		window.location.hash = `#/overview?mode=${evt.target.value}`
	}
	infoChangeCb(evt){
		window.location.hash = `#/overview?mode=${this.mode}&info=${evt.target.value}`
	}
	firstUpdated(){
	}
	async fetchData(){
		var [boxes, summaries, species] = await proxy.fetch([
			{path: 'boxes'},
			{path: 'summaries'},
			{path: 'species'}
		])
		this.species = species.reduce((obj, entry) => Object.assign(obj, {[entry._id]: entry.name}), {})
		this.boxes = boxes
		.map(box => {
			box.summaries = summaries
			.filter(summary => summary.box_id == box._id)
			.sort((a,b) => b.occupancy - a.occupancy)
			return box
		})
	}

	getInfoText(box){
		switch (this.info){
			case 'BOXES': return box.label
			case 'STATUS':
				if(box.summaries.length == 0) return 'Keine Inspektion'
				const summary = box.summaries[0]
				if(summary.state == 'STATE_EMPTY') return 'Leer'
				const species = this.getSpeciesName(summary.species_id)
				return `${species}: ${translate(summary.state)}`
			case 'LAST_INSPECTION':
				if(box.summaries.length == 0) return 'Keine'
				return new Date(box.summaries[0].lastInspection).toLocaleDateString()
		}
	}
	getSpeciesName(id){
		return this.species[id] || 'Unbekannt'
	}
	willUpdate(changedProps){
		console.log('overview willUpdate', changedProps, this.mode)
		if(changedProps.has('info') || changedProps.has('boxes')) this.addInfo()
	}
	addInfo(){
		this.boxes.forEach(box => {
			box._info = this.getInfoText(box)
		})
	}

	getBoxSelector(box){
		return () => {
			console.log('click', box, this)
			window.location.hash = `#/overview?box_id=${box._id}`
			window.location.hash = `#/detail?box_id=${box._id}`
		}
		
	}
}

customElements.define('page-overview', PageOverview)
