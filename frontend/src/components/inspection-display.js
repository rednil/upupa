import { LitElement, html } from 'lit'

export class InspectionDisplay extends LitElement {
	static get properties() {
		return {
			box_id: { type: String },
			nocoor: { type: Boolean }
		}
	}

	render() {
		// "logout" from material icons
		return html`
			<svg @click=${this.logout} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="black"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>			</a>
		`
	}
	
}

customElements.define('inspection-display', InspectionDisplay)
