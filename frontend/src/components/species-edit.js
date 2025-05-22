
import { LitElement, html } from 'lit'

export class SpeciesEdit extends LitElement {
	static get properties() {
		return {
			item: { type: Object },
		}
	}

	render() {
		return html`
			<div><label>Name</label><span>${this.item.name}</span></div>
		`
	}
}

customElements.define('species-edit', SpeciesEdit)
