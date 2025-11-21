import { css } from 'lit'
import { MapBase } from './map-base'
import { marker } from 'leaflet/dist/leaflet-src.esm.js'

export class BoxMap extends MapBase {
  static get properties() {
    return {
      boxes: { type: Array },
			selected: { type: String },
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
				z-index: 1;
			}
			.banding.required {
				background-color: yellow;
				z-index: 2;
			}
			.banding.urgent {
				background-color: orange;
				z-index: 3;
			}
			.banding.overdue {
				background-color: red;
				color: white;
				z-index: 4;
			}
			.STATE_EGGS {
				background-color: yellow;
				z-index: 1;
			}
			.STATE_BREEDING{
				background-color: green;
				color: white;
				z-index: 2;
			}
			.STATE_NESTLINGS {
				background-color: blue;
				color: white;
				z-index: 3;
			}
			.last_inspection.lt1d {
				background-color: green;
				color: white;
			}
			.last_inspection.lt7d {
				background-color: yellow;
			}
			.last_inspection.gt7d {
				background-color: red;
				color: white;
			}
    `])
  }
	constructor(){
		super()
		this.storagePrefix = 'UPUPA.OVERVIEW.MAP'
		this.boxes = []
	}
	
	updated(changed){
		super.updated(changed)
		if(!this.boxes.length) return
		if(changed.has('boxes')) {
			this.createMarkers()
			this.initView()
		}
		if(
			changed.has('boxes') ||
			changed.has('selected')
		) this.createTooltips()
		
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
	}
	initView(){
		if(this.selected){
			const box = this.boxes.find(box => box._id == this.selected)
			this.map.setView([box.lat, box.lon], 19)
		}
    else if(!this._viewInitializedFromStorage){
			const coors = this.boxes
			.filter(box => box.lat && box.lon)
			.map(box => ([box.lat, box.lon]))
			this.map.fitBounds(coors)
		}
  }
	createTooltips(){
		this.boxes
		.filter(box => box.lat && box.lon)
		.forEach(box => {
			var { label, classList } = box
			if(!label || label=='') return box.marker.closeTooltip()
			if(box._id == this.selected) classList = [ ...classList, 'selected']
			box.marker.bindTooltip(label, {
				permanent: true,
				interactive: true,
				className: classList.join(' ')
			})
			.openTooltip()
		})
	}
	getBoxSelector(box){
		return () => {
			window.location.hash = `#/overview?box_id=${box._id}`
			window.location.hash = `#/status?box_id=${box._id}`
		}
		
	}
}

customElements.define('box-map', BoxMap)
