import { css } from 'lit'
import { MapBase } from './map-base'
import { marker } from 'leaflet/dist/leaflet-src.esm.js'

export class BoxMap extends MapBase {
  static get properties() {
    return {
      boxes: { type: Array },
			box_id: { type: String },
			info: { type: String },
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
	constructor(){
		super()
		this.boxes = []
	}
	
	updated(changed){
		super.updated(changed)
		if(!this.boxes.length) return
		if(changed.has('boxes')) this.createMarkers()
		if(
			changed.has('boxes') ||
			changed.has('info') ||
			changed.has('box_id')
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
			if(!text || text=='') return box.marker.closeTooltip()
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
