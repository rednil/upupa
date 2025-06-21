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
import { map, tileLayer, circleMarker, marker, Icon, layerGroup, Control, DomEvent, DomUtil } from 'leaflet/dist/leaflet-src.esm.js'
import leafletCSS from 'leaflet/dist/leaflet.css'
import { location_disabled, location_off, location_on, location_searching, my_location } from '../icons'

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
			info: { type: String },
			locationEnabled: {type: Boolean}
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
			.my_location {
				z-index: 100;
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
		if(navigator.geolocation) {
			this.addLocationControl()
			// put the location circlemarker on top of all others
			this.map.getPane('overlayPane').style.zIndex = 1000
		}
	}
	disconnectedCallback() {
    super.disconnectedCallback()
    this.stopWatchingLocation()
    if (this.map) {
      this.map.remove()
    }
  }
	addLocationControl() {
    const LocationControl = Control.extend({
      onAdd: map => {
        const container = DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.style.backgroundColor = 'white';
        container.style.width = '30px';
        container.style.height = '30px';
        container.style.borderRadius = '4px';
        container.style.cursor = 'pointer';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.title = 'Turn on GPS';

        // You can use an SVG icon or an image for the icon
        container.innerHTML = location_on

        DomEvent
				.on(container, 'click', DomEvent.stopPropagation)
        .on(container, 'click', DomEvent.preventDefault)
        .on(container, 'click', () => this.locationEnabled = !this.locationEnabled);

        return container;
      },
      onRemove: function(map) {
        // Nothing to do here
      }
    });
		const CenterMapControl = Control.extend({
      onAdd: map => {
        const container = DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.style.backgroundColor = 'white';
        container.style.width = '30px';
        container.style.height = '30px';
        container.style.borderRadius = '4px';
        container.style.cursor = 'pointer';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.title = 'Center map on my location';

        // You can use an SVG icon or an image for the icon
        container.innerHTML = location_searching

        DomEvent
				.on(container, 'click', DomEvent.stopPropagation)
        .on(container, 'click', DomEvent.preventDefault)
        .on(container, 'click', () => this.centerMapOnLocation());
        return container;
      },
      onRemove: function(map) {
        // Nothing to do here
      }
    });
    
		this.centerMapControl = new CenterMapControl({ position: 'bottomright' })
		this.locationControl = new LocationControl({ position: 'bottomright' })
		this.map.addControl(this.locationControl)
  }
	startWatchingLocation(evt) {
		this.locationControl.getContainer().innerHTML = location_off
		
		this.map.addControl(this.centerMapControl)

		this.centerMapControl.getContainer().innerHTML = location_searching
    this.locationWatchId = navigator.geolocation.watchPosition(
      this.handleLocationSuccess.bind(this),
      this.handleLocationError.bind(this),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    )
  }

  stopWatchingLocation() {
		this.locationControl.getContainer().innerHTML = location_on
		this.map.removeControl(this.centerMapControl)
		
    if (this.locationWatchId) {
      navigator.geolocation.clearWatch(this.locationWatchId)
      this.locationWatchId = null
    }
    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker)
      this.userLocationMarker = null
    }
  }
	handleLocationSuccess(position) {
    const { latitude, longitude } = position.coords
    const latLng = [latitude, longitude]
		this.centerMapControl.getContainer().innerHTML = my_location
    if (this.userLocationMarker) {
      this.userLocationMarker.setLatLng(latLng)
    } else {
      this.userLocationMarker = circleMarker(latLng, {
				color: 'red',
				fillColor: '#f03',
				fillOpacity: 0.5,
				radius: 10,
				className: 'my_location'
			})
			.addTo(this.map)
    }

  }
	centerMapOnLocation() {
    if (this.userLocationMarker) {
      this.map.panTo(this.userLocationMarker.getLatLng());
    } 
  }
  handleLocationError(error) {
    let message
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'User denied the request for Geolocation.'
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable.'
        break;
      case error.TIMEOUT:
        message = 'The request to get user location timed out.'
        break;
      case error.UNKNOWN_ERROR:
        message = 'An unknown error occurred.'
        break;
    }
    console.error('Geolocation Error:', message);
    this.centerMapControl.getContainer().innerHTML = location_disabled
		//alert(`Error getting your location: ${message}`);
    //this.locationEnabled = false; // Turn off the toggle on error
  }
	updated(changed){
		if(!this.boxes.length) return
		if(changed.has('boxes')) this.createMarkers()
		if(
			changed.has('boxes') ||
			changed.has('info') ||
			changed.has('box_id')
		) this.createTooltips()
		if (this.locationEnabled) {
			this.startWatchingLocation()
		} else {
			this.stopWatchingLocation()
		}
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
