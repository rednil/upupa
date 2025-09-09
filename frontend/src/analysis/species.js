import { LitElement, html, css } from 'lit'
import '../charts/species-relative'
import { translate } from '../translator'

export class AnalysisSpecies extends LitElement {
	static get properties() {
		return {
			species_id: { type: String }
		}
	}
	render() {
		return html`
			<chart-species-relative species_id=${this.species_id}></chart-species-relative>
		`
	}
}

customElements.define('analysis-species', AnalysisSpecies)
