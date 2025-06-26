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

export class MapBase extends LitElement {
  static get properties() {
    return {
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
				user-select: none;
			}
			#map {
				height: 100%;
				width: 100%;
			}
			.my_location {
				z-index: 100;
			}
    `]
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
	updated(){
		if (this.locationEnabled) {
			this.startWatchingLocation()
		} else {
			this.stopWatchingLocation()
		}
	}
	
}

customElements.define('map-base', MapBase)
