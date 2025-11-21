import { html, css, LitElement } from 'lit'

import '../components/box-map'
import '../components/box-list'
import {translate} from '../translator'
import { setUrlParams } from '../router'

import { OverviewBox } from '../overview/box'
import { OverviewArchitecture } from '../overview/architecture'
import { OverviewMounting } from '../overview/mounting'
import { OverviewSpecies } from '../overview/species'
import { OverviewStatus } from '../overview/status'
import { OverviewInspection } from '../overview/inspection'
import { OverviewBandingNestlings } from '../overview/banding/nestlings'
import { OverviewBandingParents } from '../overview/banding/parents'

const INFO = 'OVERVIEW.INFO'
const MODE = 'OVERVIEW.MODE'

const infoOptions = {
	BOX: new OverviewBox(),
	ARCHITECTURE: new OverviewArchitecture(),
	MOUNTING: new OverviewMounting(),
	SPECIES: new OverviewSpecies(),
	STATUS: new OverviewStatus(),
	LAST_INSPECTION: new OverviewInspection(),
	BAND_STATUS_NESTLINGS: new OverviewBandingNestlings(),
	BAND_STATUS_PARENTS: new OverviewBandingParents(),
}

export class PageOverview extends LitElement {
  static get properties() {
    return {
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
		this.info = localStorage.getItem(INFO) 
		if(!infoOptions[this.info]) this.info = 'BOX'
		this.mode = localStorage.getItem(MODE) || 'MAP'
	}

	willUpdate(changed){
		if(changed.has('info')){
			this.infoAssembler = infoOptions[this.info]
		}
		if(changed.has('year') || changed.has('info')){
			this.assembleInfo()
		}	
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
					selected=${this.box_id}
				></box-map>
			`: html`
				<box-list 
					class=${this.mode}
					id="list"
					.boxes=${this.boxes}
					info=${this.info}></box-list>
			`}
			<div class=controls>
				<select @change=${this.infoChangeCb} .value=${this.info}>
					${Object.keys(infoOptions).map(option => html`
						<option ?selected=${option == this.info} value=${option}>${translate(`OVERVIEW.${option}`)}</option>
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

	async assembleInfo(){
		this.boxes = await this.infoAssembler.getInfo(this.year, this.mode)
		this.requestUpdate()
	}

	getBoxSelector(box){
		return () => {
			window.location.hash = `#/overview?box_id=${box._id}`
			window.location.hash = `#/detail?box_id=${box._id}`
		}
	}
}

customElements.define('page-overview', PageOverview)

