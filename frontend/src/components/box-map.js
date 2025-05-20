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
			info: { type: String }
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
				z-index: 1000;
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
			.banding.possible {
				background-color: green;
				color: white;
			}
			.banding.required {
				background-color: yellow;
			}
			.banding.urgent {
				background-color: orange;
			}
			.banding.overdue {
				background-color: red;
				color: white;
			}
    `]
  }
	constructor(){
		super()
		this.boxes = []
	}
	
  render() {
    return html`
			
			<div id="map"></div>
			
    `
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


	updated(changed){
		if(!this.boxes.length) return
		if(changed.has('boxes')) this.createMarkers()
		this.createTooltips()
	}
	createMarkers(){
		const boxes = this.boxes.filter(box => box.lat && box.lon)
		this.markerGroup.clearLayers()
		boxes.forEach(box => {
			box.marker = marker({})
			.setLatLng([box.lat, box.lon])
			.on('click', this.getBoxSelector(box))
			this.markerGroup.addLayer(box.marker)
		})
		if(this.box_id){
			const box = boxes.find(box => box._id == this.box_id)
			this.map.setView([box.lat, box.lon],17)
		}
    else{
			const coors = boxes.map(box => [box.lat, box.lon])
			this.map.fitBounds(coors)
		}
  }
	createTooltips(){
		this.boxes
		.filter(box => box.lat && box.lon)
		.forEach(box => {
			var { text, className } = box._info
			//text = `${box.label}: ${text}`
			if(box._id == this.box_id) className += ' selected'
			box.marker.bindTooltip(text, {
				permanent: true,
				interactive: true,
				className
			})
			.openTooltip()
		})
	}
	getBoxSelector(box){
		return () => {
			console.log('click', box, this)
			window.location.hash = `#/overview?box_id=${box._id}`
			window.location.hash = `#/status?box_id=${box._id}`
		}
		
	}
}

customElements.define('box-map', BoxMap)
