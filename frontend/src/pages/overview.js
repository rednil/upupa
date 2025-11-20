import { html, css, LitElement } from 'lit'
import { mcp } from '../mcp'
import '../components/box-map'
import '../components/box-list'
import {translate} from '../translator'
import { setUrlParams } from '../router'
import { getBoxLabel } from '../forms/select-box'

const msPerDay = 1000 * 60 * 60 * 24
const currentYear = new Date().getFullYear()
const INFO = 'OVERVIEW.INFO'
const MODE = 'OVERVIEW.MODE'
const infoOptions = [
	'BOXES',
	'ARCHITECTURES',
	'MOUNTING',
	'SPECIES',
	'STATUS',
	'LAST_INSPECTION',
	'BAND_STATUS_NESTLINGS',
	'BAND_STATUS_PARENTS'
]

function getShortDate(date){
	return new Date(date).toLocaleDateString(undefined, {day: "numeric", month: "numeric"})
}

export class PageOverview extends LitElement {
  static get properties() {
    return {
      //boxes: { type: Array },
			box_id: { type: String },
			info: { type: String },
			mode: { type: String },
			year: { type: Number }
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
		//this.boxes = []
		//this.data = {}
		this.info = localStorage.getItem(INFO) || 'BOXES'
		this.mode = localStorage.getItem(MODE) || 'MAP'
	}
	willUpdate(changed){
		if(changed.has('year') || changed.has('info')) this.fetchData()	
	}
  render() {
		if(!this.boxes) return
    return html`
			${this.mode == 'MAP' ? html`
				<box-map
					showLocationControls
					class=${this.mode}
					id="map"
					.boxes=${this.boxes}
					box_id=${this.box_id}
				></box-map>
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
		localStorage.setItem(MODE, this.mode = evt.target.value)
		setUrlParams({mode: this.mode})
	}
	infoChangeCb(evt){
		localStorage.setItem(INFO, this.info = evt.target.value)
	}
	
	async fetch(type){
		const response = await mcp.getByType(type)
		return response.reduce((obj, {_id, name}) => Object.assign(obj, {[_id]: name}), {})
	}
	async fetchData(){
		if(!this.boxes){
			this.boxes = await mcp.db()
			.query('upupa/boxes', {
				startkey: [this.year],
				endkey: [this.year, {}],
				include_docs: true
			})
			.then(({rows}) => rows.map(view => view.doc))
		}
		switch(this.info){
			case 'ARCHITECTURES':
				this.architectures = this.architectures || await this.fetch('architecture')
				break
			case 'MOUNTING':
				this.mountings = this.mountings || await this.fetch('mounting')
				break
			case 'SPECIES':
				this.species = this.species || await this.fetch('species')
				break
			case 'STATUS':
			case 'LAST_INSPECTION':
			case 'BAND_STATUS_NESTLINGS':
			case 'BAND_STATUS_PARENTS':
				if(!this.lastInspections){
					this.lastInspections = await mcp.db()
					.query('upupa/inspections', {
						group: true,
						group_level: 2,
						startkey: [this.year],
						endkey: [this.year, {}],
					})
					.then(({rows}) => rows.map(({key, value}) => value))
					this.boxes.forEach(box => {
						box.lastInspection = this.lastInspections.find(lastInspection => lastInspection.box_id == box._id)
					})
				}
				break
		}
		this.addInfo()
		this.requestUpdate()
	}
	speciesShouldBeKnown(state){
		return (
			state != 'STATE_EMPTY' &&
			state != 'STATE_NEST_BUILDING' &&
			state != 'STATE_NEST_READY' &&
			state != 'STATE_OCCUPIED'
		)
	}
	getInfoText(box){
		const {lastInspection} = box
		var text = ''
		var className = ''
		switch (this.info){
			case 'BOXES':
				text = getBoxLabel(box)
				break
			case 'SPECIES':
				if(
					lastInspection &&
					(
						lastInspection.species_id ||
						this.speciesShouldBeKnown(lastInspection.state)
					)
				) {
					text = this.getSpeciesName(lastInspection.species_id)
				}
				break
			case 'ARCHITECTURES':
				text = this.architectures[box.architecture_id] || ''
				break
			case 'MOUNTING':
				text = this.mountings[box.mounting_id] || ''
				break
			case 'BAND_STATUS_NESTLINGS':
				if(
					lastInspection?.state == 'STATE_BREEDING' ||
					lastInspection?.state == 'STATE_NESTLINGS'
				){
					if(lastInspection.nestlingsBanded > 0){
						text = `Beringt: ${lastInspection.nestlingsBanded}`,
						className = 'banded'
					}
					else if(
						lastInspection.bandingWindowStart && 
						lastInspection.bandingWindowStart 
						
					){
						const now = new Date()
						const daysRemaining = Math.round((new Date(lastInspection.bandingWindowEnd).getTime() - now.getTime()) / msPerDay)
						if(now > new Date(lastInspection.bandingWindowStart)){
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
							text = `${getShortDate(lastInspection.bandingWindowStart)}-${getShortDate(lastInspection.bandingWindowEnd)}`
						}
					}
				}
				break 
			case 'STATUS':
				if(!lastInspection) text = ''
				else {
					text = translate(lastInspection.state)
					className = lastInspection.state
				}
				break
			case 'LAST_INSPECTION':
				className = 'last_inspection'
				if(!lastInspection) text = 'Keine'
				else {
					const daysPassed = Math.round((new Date().getTime() - new Date(lastInspection.date).getTime()) / msPerDay)
					if(!this.year || this.year == currentYear){
						text = `${daysPassed}d`
						if(daysPassed < 1) className += ' lt1d'
						else if(daysPassed < 7) className += ' lt7d'
						else className += ' gt7d'
					}
					else text = new Date(lastInspection.date).toLocaleDateString()
				}
				break
			case 'BAND_STATUS_PARENTS':
				if(lastInspection?.occupancy) { 
					text = `M: ${lastInspection.maleBanded?'ja':'nein'}, W: ${lastInspection.femaleBanded?'ja':'nein'}`
				}
				break
		}
		return { text, className }
	}
	
	getSpeciesName(id){
		return this.species[id] || 'Unbekannt'
	}
	
	addInfo(){
		this.boxes.map(box => {
			box._info = this.getInfoText(box)
		})
		// trigger an updated of map/list node
		this.boxes = [...this.boxes]
	}

	getBoxSelector(box){
		return () => {
			window.location.hash = `#/overview?box_id=${box._id}`
			window.location.hash = `#/detail?box_id=${box._id}`
		}
		
	}
}

customElements.define('page-overview', PageOverview)
