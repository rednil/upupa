import { LitElement, html, css } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import { home_pin, wrong_location } from '../icons'

export class LinkMap extends LitElement {
	static get properties() {
		return {
			box_id: { type: Object },
			nocoor: { type: Boolean }
		}
	}
	static get styles() {
		return css`
			:host, a {
				display: flex;
			}
			
		`
	}
	constructor(){
		super()
		this.nocoor = false
	}
	render() {
		if (this.nocoor) return unsafeSVG(wrong_location)
		return html`
			<a href="#/overview?mode=MAP&box_id=${this.box_id}">
				${unsafeSVG(home_pin)}
			</a>
		`
	}
}

customElements.define('link-map', LinkMap)
