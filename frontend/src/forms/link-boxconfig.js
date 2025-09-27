import { LitElement, html, css } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import { settings } from '../icons'

export class LinkBoxconfig extends LitElement {
	static get properties() {
		return {
			box_id: { type: String },
		}
	}
	static get styles() {
		return css`
			:host, a {
				display: flex;
			}
			
		`
	}
	render() {
		return html`
			<a href="#/config?type=box&id=${this.box_id}">
				${unsafeSVG(settings)}
			</a>
		`
	}
}

customElements.define('link-boxconfig', LinkBoxconfig)
