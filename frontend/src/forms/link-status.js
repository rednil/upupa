import { LitElement, html, css } from 'lit'
import { error, info } from '../icons'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

export class LinkStatus extends LitElement {
	static get properties() {
		return {
			box_id: { type: String },
			nodata: { type: Boolean }
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
			<a href="#/status?box_id=${this.box_id}">
				${this.nodata ? unsafeSVG(error) : unsafeSVG(info)}
			</a>
		`
	}
}

customElements.define('link-status', LinkStatus)
