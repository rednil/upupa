import { css } from 'lit'
import { MapBase } from './map-base'
import { marker } from 'leaflet/dist/leaflet-src.esm.js'

export class SelectLocation extends MapBase {
  static get properties() {
    return {
      value: { type: Object },
			oldValue: { type: Object },
			disabled: { type: Boolean }
    }
  }

  static get styles() {
    return super.styles.concat([
			css`
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
			
    `])
  }
	shouldUpdate(){
		return this.value
	}
	firstUpdated(){
		super.firstUpdated()
		this.createMarker()
		this.map.on('move', this.move.bind(this))
	}
	move(evt){
		// if dragged by user, evt.originalEvent is a "MouseEvent"
		// if moved (via animation, slow!) from a value change, it is null
		if(!evt.originalEvent) return
		this.value = latLng2latLon(this.map.getCenter())
		this.dispatchEvent(new CustomEvent('change'))
	}
	updated(changed){
		super.updated(changed)
		if(changed.has('value')) this.new.setLatLng(latLon2latLng(this.value))
		if(changed.has('oldValue')) this.old.setLatLng(latLon2latLng(this.oldValue))
		this.map.panTo(latLon2latLng(this.value))
		if(this.disabled) this.map.dragging.disable()
		else this.map.dragging.enable()
		
	}
	createMarker(){
		this.markerGroup.clearLayers()
		this.old = marker(latLon2latLng(this.oldValue || this.value), { opacity: 0.3	})
		this.new = marker(latLon2latLng(this.value))
		this.markerGroup.addLayer(this.old)
		this.markerGroup.addLayer(this.new)
		this.map.setView(latLon2latLng(this.value), 17)
  }
}

const latLon2latLng = ({lat, lon}) => ({lat, lng: lon})
const latLng2latLon = ({lat, lng}) => ({lat, lon: lng})

customElements.define('select-location', SelectLocation)
