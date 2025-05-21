import { LitElement, html } from 'lit'

export class PageBoxconfig extends LitElement {
	static get properties() {
		return {
			box_id: { type: String },
		}
	}

	render() {
		return html`
			<div>Nistkasten - Konfiguration</div>
		`
	}
}

customElements.define('page-boxconfig', PageBoxconfig)
