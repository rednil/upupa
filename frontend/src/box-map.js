/* 
leaflet is a pain in the ass to configure for esm import syntax.
css and icons need special handling, both in web-dev-server.config
and rollup.config. rollup needs to manually copy the icons and needs 
rollup-plugin-import-css to handle the css import. web-dev-server needs 
the dev-server-esbuild module to properly serve the css file. finally, we
need an unsaveCSS include in this file and need to update the icon path for
leaflet marker icons, because by default it searches them in the root folder
*/

import { LitElement, html, css, unsafeCSS } from 'lit'
import { map, tileLayer, tooltip, marker, Icon, layerGroup } from 'leaflet/dist/leaflet-src.esm.js'
import { proxy } from './proxy'
import leafletCSS from 'leaflet/dist/leaflet.css'

const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const leafletIconPath = 'node_modules/leaflet/dist/images'
delete Icon.Default.prototype._getIconUrl

Icon.Default.mergeOptions({
  iconRetinaUrl: `${leafletIconPath}/marker-icon-2x.png`,
  iconUrl: `${leafletIconPath}/marker-icon.png`,
  shadowUrl: `${leafletIconPath}/marker-shadow.png`,
})

export class BoxMap extends LitElement {
  static get properties() {
    return {
      boxes: { type: Array },
			box_id: { type: String },
			type: { type: String }
    }
  }

  static get styles() {
    return [
			unsafeCSS(leafletCSS), 
			css`
		  :host {
        display: flex;
        flex-direction: column;
				width: 100%;
			}
			#map {
				height: 100%;
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
    `]
  }
	constructor(){
		super()
		this.boxes = []
		this.type = 'LABEL'
		this.fetchData()
	}
	
  render() {
    return html`
			
			<div id="map"></div>
			<div class=controls>
				<select @change=${this.typeChangeCb}>
					<option value="LABEL">Bezeichnung</option>
					<option value="STATUS">Aktueller Status</option>
					<option value="LAST_INSPECTION">Letzte Inspektion</option>
					<option value="BAND_STATUS_NESTLINGS">Beringung Jungvögel</option>
					<option value="BAND_STATUS_MOTHER">Beringung Altvogel</option>
				</select>
				<div class="mode">
					<input type="radio" name="mode" value="MAP">
					<label for="html">Map</label>
					<input type="radio" name="mode" value="LIST">
					<label for="css">List</label>
				</div>
			</div>
    `
  }
	typeChangeCb(evt){
		this.type = evt.target.value
	}
	firstUpdated(){
		const mapContainer = this.shadowRoot.querySelector('#map')
		this.map = map(mapContainer)
		tileLayer(tileUrl, {
			maxZoom: 22,
			attribution
		})
		.addTo(this.map)
		this.markerGroup = layerGroup()
		.addTo(this.map)
	}
	async fetchData(){
		var [boxes, summaries, species] = await proxy.fetch([
			{path: 'boxes'},
			{path: 'summaries'},
			{path: 'species'}
		])
		this.species = species.reduce((obj, entry) => Object.assign(obj, {[entry._id]: entry.name}), {})
		this.boxes = boxes
		.filter(box => box.lat && box.lon)
		.map(box => {
			box.summaries = summaries
			.filter(summary => summary.box_id == box._id)
			.sort((a,b) => b.occupancy - a.occupancy)
			return box
		})
	}

	getTooltipText(box){
		switch (this.type){
			case 'LABEL': return box.label
			case 'STATUS':
				if(box.summaries.length == 0) return 'Keine Inspektion'
				const summary = box.summaries[0]
				if(summary.state == 'EMPTY') return 'Leer'
				const species = this.getSpeciesName(summary.species_id)
				return `${summary.state}: ${species}`
			case 'LAST_INSPECTION':
				if(box.summaries.length == 0) return 'Keine'
				return new Date(box.summaries[0].lastInspection).toLocaleDateString()
		}
	}
	getSpeciesName(id){
		return this.species[id] || 'Unbekannt'
	}
	updated(changed){
		console.log('changed', changed)
		if(!this.boxes.length) return
		if(changed.has('boxes')) this.createMarkers()
		this.createTooltips()
	}
	createMarkers(){
		this.boxes.forEach(box => {
			box.marker = marker({})
			.setLatLng([box.lat, box.lon])
			.on('click', this.getBoxSelector(box))
			this.markerGroup.addLayer(box.marker)
		})
		if(this.box_id){
			const box = this.boxes.find(box => box._id == this.box_id)
			this.map.setView([box.lat, box.lon],17)
		}
    else{
			const coors = this.boxes.map(box => [box.lat, box.lon])
			this.map.fitBounds(coors)
		}
  }
	createTooltips(){
		this.boxes.forEach(box => {
			box.marker.bindTooltip(this.getTooltipText(box), {
				permanent: true,
				interactive: true,
				className: box._id == this.box_id ? 'selected' : ''
			})
			.openTooltip()
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

customElements.define('box-map', BoxMap)
