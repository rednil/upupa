import { html, css } from 'lit'
import { MapBase } from './map-base'
import { marker } from 'leaflet/dist/leaflet-src.esm.js'

const fallback = {
	lat: 46.79892,
	lon: 12.78289
}

export class LocationEdit extends MapBase {
  static get properties() {
    return {
      value: { type: Object },
			oldValue: { type: Object },
			disabled: { type: Boolean },
    }
  }
	static get styles() {
		return [
			MapBase.styles,
			css`
				.inputs {
					display: flex;
					flex-direction: row;
					justify-content: space-between;
					padding-bottom: 0.5em;
				}
				.inputs input {
					width: 8em;
					text-align: right;
				}
				.inputs > div:last-child {
					text-align: right;
				}
			`
		]
	}
	constructor(){
		super()
		this.positions = {}
		this.value = null
	}
	
	set value(value){
		if(valid(value)){
			this._value = value
			this.oldValue = value
		}
		else this._value = fallback
	}
	get value(){
		return this._value
	}
	render(){
		const lat = Math.round((this.value?.lat || 0) * 1000000) / 1000000
		const lon = Math.round((this.value?.lon || 0) * 1000000) / 1000000

		return html`
			
			<div class="inputs">
				<div>
					<label>Breitengrad</label>
					<input type="number" .value=${lat}>
				</div>
				<div>
					<label>Längengrad</label>
					<input type="number" .value=${lon}>
				</div>
			</div>
			${super.render()}
		`
		
	}
	firstUpdated(){
		super.firstUpdated()
		this.map.setView(latLon2latLng(this.value), 17)
		this.map.options.scrollWheelZoom = 'center'
		this.map.on('move', this.move.bind(this))
		this.map.on('moveend', this.moveend.bind(this))
	}
	
	move(evt){
		// if dragged by user, evt.originalEvent is a "MouseEvent"
		// if moved (via animation, slow!) from a value change, it is null
		if(evt.originalEvent) this.userMovedCenter()
	}
	moveend(){
		// TODO: check if this works everywhere in upupa
		this.userMovedCenter()
	}
	userMovedCenter(){
		this._value = latLng2latLon(this.map.getCenter())
		this.updateMarker('value')
		this.dispatchEvent(new CustomEvent('change'))
		this.requestUpdate()
	}
	updated(changed){
		super.updated(changed)
		if(changed.has('value')) {
			this.updateMarker('value')
			if(valid(this.value)) this.map.panTo(latLon2latLng(this.value))
			else this.map.panTo(latLon2latLng(fallback))
		}
		if(changed.has('oldValue')) this.updateMarker('oldValue', 0.3)
		if(this.disabled) this.map.dragging.disable()
		else this.map.dragging.enable()
	}
	
	updateMarker(prop, opacity = 1){
		const coor = this[prop]
		let position = this.positions[prop]
		if(valid(coor)){
			const latlng = latLon2latLng(coor)
			if(position) position.marker.setLatLng(latlng)
			else {
				position = {
					marker: marker(latlng, { opacity })
				}
				position.layer = this.markerGroup.addLayer(position.marker)
				this.positions[prop] = position
			}
		}
		else if(position) {
			this.markerGroup.removeLayer(position.layer)
			delete this.positions[prop]
		}
	}
}

const valid = pos => pos?.lat && pos?.lon
const latLon2latLng = ({lat, lon}) => ({lat, lng: lon})
const latLng2latLon = ({lat, lng}) => ({lat, lon: lng})

customElements.define('location-edit', LocationEdit)
