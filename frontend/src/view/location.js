import { MapBase } from '../map/base'
import { marker } from 'leaflet/dist/leaflet-src.esm.js'

const fallback = {
	lat: 46.79892,
	lon: 12.78289
}
export class ViewLocation extends MapBase {
  static get properties() {
    return {
      value: { type: Object },
    }
  }
	
	firstUpdated(){
		super.firstUpdated()
		this.map.dragging.disable()
		this.map.scrollWheelZoom.disable()
		this.map.setView(latLon2latLng(fallback), 17)
	}
	
	updated(changed){
		super.updated(changed)
		if(changed.has('value')) this.updateMarker('value')
	}
	
	updateMarker() {
		const { value } = this
		if(value?.lat && value?.lon){
			const latlng = latLon2latLng(value)
			if(this.marker) this.marker.setLatLng(latlng)
			else {
				this.marker = marker(latlng)
				this.layer = this.markerGroup.addLayer(this.marker)
			}
		}
		else if(this.layer) {
			this.markerGroup.removeLayer(this.layer)
			delete this.marker
			delete this.layer
			
		}
		this.map.setView(latLon2latLng(this.marker ? value : fallback), 17)
	}
}

const latLon2latLng = ({lat, lon}) => ({lat, lng: lon})

customElements.define('view-location', ViewLocation)
