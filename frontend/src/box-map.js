import { LitElement, html, css } from 'lit'
import { map, tileLayer, tooltip } from 'leaflet/dist/leaflet-src.esm.js'
export class BoxMap extends LitElement {
  static get properties() {
    return {
      boxes: { type: Array }
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
				width: 100%;
			}
			#map {
				height: 100%;
				width: 100%;
			}
			
    `
  }
	constructor(){
		super()
		this.boxes = []
	}
	
  render() {
    return html`
		<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
		integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
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
		this.fetchBoxes()
	}
	async fetchBoxes(){
    const response = await fetch('/api/boxes')
    this.boxes = await response.json()
		const coors = this.boxes.map(box => [box.lat, box.lon])
		this.map.fitBounds(coors)
		this.boxes.forEach(box => {
			tooltip({
				color: 'red',
				permanent: true
			})
			.setLatLng([box.lat, box.lon])
			.setContent(box.label)
			.addTo(this.map)
		})
    
  }

}

customElements.define('box-map', BoxMap)
