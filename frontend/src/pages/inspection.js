import { LitElement, html } from 'lit'

export class PageInspection extends LitElement {
	static get properties() {
		return {
			box_id: { type: String },
		}
	}

	render() {
		return html`
			
		`
	}
}

customElements.define('page-inspection', PageInspection)
