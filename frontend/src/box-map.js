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
import { map, tileLayer, tooltip, marker, Icon } from 'leaflet/dist/leaflet-src.esm.js'
import { proxy } from './proxy'
import leafletCSS from 'leaflet/dist/leaflet.css'

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
			box_id: { type: String }
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
    `]
  }
	constructor(){
		super()
		this.boxes = []
		this.fetchData()
	}
	
  render() {
    return html`
		
			<div id="map">
				
			</div>
    `
  }

	firstUpdated(){
		const mapContainer = this.shadowRoot.querySelector('#map')
		this.map = map(mapContainer)
		tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 22,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(this.map);
	}
	async fetchData(){
		var [boxes, summaries] = await proxy.fetch([{path: 'boxes'}, {path: 'summaries'}])
		this.boxes = boxes
		.filter(box => box.lat && box.lon)
		.map(box => {
			box.summaries = summaries
			.filter(summary => summary.box_id == box._id)
			.sort((a,b) => b.occupancy - a.occupancy)
			return box
		})
	}

	updated(){
		if(!this.boxes.length) return
		this.boxes.forEach(box => {
			/*
			tooltip({
				permanent: true,
				interactive: true,
				className: box._id == this.box_id ? 'selected' : ''
			})
			.setLatLng([box.lat, box.lon])
			.setContent(box.label)
			.on('click', this.getBoxSelector(box))
			.addTo(this.map)
			*/
			marker({
			})
			.setLatLng([box.lat, box.lon])
			.on('click', this.getBoxSelector(box))
			.bindTooltip(box.label, {
				permanent: true,
				interactive: true,
				className: box._id == this.box_id ? 'selected' : ''
			}).openTooltip()
			.addTo(this.map)
			
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
	getBoxSelector(box){
		return () => {
			console.log('click', box, this)
			window.location.hash = `#/box-map?box_id=${box._id}`
			window.location.hash = `#/box-status?box_id=${box._id}`
		}
		
	}
}

customElements.define('box-map', BoxMap)
