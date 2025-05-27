import { LitElement, html, css } from 'lit'
import { Proxy } from '../proxy'

import '../components/box-map'
import '../components/box-list'
import {translate} from '../translator'

const infoOptions = [
	'BOXES',
	'SPECIES',
	'STATUS',
	'LAST_INSPECTION',
	'BAND_STATUS_NESTLINGS',
	'BAND_STATUS_FEMALE'
]

function getShortDate(date){
	return new Date(date).toLocaleDateString(undefined, {day: "numeric", month: "numeric"})
}

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
		this.proxy = new Proxy(this)
		this.fetchData()
	}
	
  render() {
    return html`
			${this.mode == 'MAP' ? html`
				<box-map class=${this.mode} id="map" .boxes=${this.boxes} info=${this.info} box_id=${this.box_id}></box-map>
			`: html`
				<box-list class=${this.mode} id="list" .boxes=${this.boxes} info=${this.info}></box-list>
			`}
			<div class=controls>
				<select @change=${this.infoChangeCb} .value=${this.info}>
					${infoOptions.map(option => html`
						<option ?selected=${option == this.info} value=${option}>${translate(option)}</option>
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
		var [boxes, summaries, species] = await this.proxy.fetchMulti(
			['boxes'],
			['summaries', '$sort=occupancy:-1'],
			['species']
		)

		this.species = species.reduce((obj, entry) => Object.assign(obj, {[entry._id]: entry.name}), {})
		this.boxes = boxes
		.map(box => {
			box.summaries = summaries
			.filter(summary => summary.box_id == box._id)
			//.sort((a,b) => b.occupancy - a.occupancy) is done by backend
			return box
		})
	}

	getInfoText(box){
		const summary = box.summaries[0]
		var text = ''
		var className = ''
		switch (this.info){
			case 'BOXES':
				text = box.name
				break
			case 'SPECIES':
				if(!summary) text = '---'
				else if(summary.state == 'STATE_EMPTY') {
					text = 'Leer'
				}
				else {
					text = this.getSpeciesName(summary.species_id)
				}
				break
			case 'BAND_STATUS_NESTLINGS':
				if(!summary) text = '---'
				else if(summary.state == 'STATE_NESTLINGS' || summary.state == 'STATE_SUCCESS'){
					if(summary.nestlingsBanded > 0){
						text = `Beringt: ${summary.nestlingsBanded}`,
						className = 'banded'
					}
					else if(summary.bandingWindowStart && summary.bandingWindowStart){
						const now = new Date()
						const daysRemaining = (new Date(summary.bandingWindowEnd).getTime() - now.getTime()) / 86400000
						if(now > new Date(summary.bandingWindowStart)){
							className = 'banding'
							if(daysRemaining < 0) {
								text = 'Verpasst'
								className += ' overdue'
							}
							else if(daysRemaining < 2) {
								className += ' urgent'
								text = 'Dringend'
							}
							else if(daysRemaining < 4) {
								className += ' required'
								text = 'Erforderlich'
							}
							else {
								className += ' possible'
								text = 'Möglich'
							}
						}
						else {
							className += ' todo'
							text = `${getShortDate(summary.bandingWindowStart)}-${getShortDate(summary.bandingWindowEnd)}`
						}
					}
				}
				// if we have another state, display that other state
				if(text.length) break 
			case 'STATUS':
				if(!summary) text = '---'
				else if(summary.state == 'STATE_EMPTY') {
					text = 'Leer'
				}
				else {
					const species = this.getSpeciesName(summary.species_id)
					text = translate(summary.state)
				}
				break
			case 'LAST_INSPECTION':
				if(box.summaries.length == 0) text = 'Keine'
				else text = new Date(box.summaries[0].lastInspection).toLocaleDateString()
				break
		}
		return { text, className }
	}
	
	getSpeciesName(id){
		return this.species[id] || 'Unbekannt'
	}
	willUpdate(changedProps){
		if(changedProps.has('info') || changedProps.has('boxes')) this.addInfo()
	}
	addInfo(){
		this.boxes.forEach(box => {
			box._info = this.getInfoText(box)
		})
	}

	getBoxSelector(box){
		return () => {
			window.location.hash = `#/overview?box_id=${box._id}`
			window.location.hash = `#/detail?box_id=${box._id}`
		}
		
	}
}

customElements.define('page-overview', PageOverview)
