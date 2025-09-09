import { LitElement, html, css } from 'lit'
import '../charts/survival-rate'
import { translate } from '../translator'

export class AnalysisSuccess extends LitElement {
	static get properties() {
		return {
			species_id: { type: String }
		}
	}
	render() {
		return html`
			<chart-survival-rate species_id=${this.species_id} type="egg"></chart-survival-rate>
			<chart-survival-rate species_id=${this.species_id} type="clutch"></chart-survival-rate>
		`
	}
}

customElements.define('analysis-success', AnalysisSuccess)
