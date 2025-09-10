import { LitElement, html, css } from 'lit'
import '../charts/prop-species'
import '../charts/prop-year'
import { AnalysisBase } from './base'

export class AnalysisClutchSize extends AnalysisBase {
	
	render() {
		return html`
			<chart-prop-species type="clutchSize" species_id=${this.species_id}></chart-prop-species>
			<chart-prop-year type="clutchSize" species_id=${this.species_id}></chart-prop-year>
		`
	}
}

customElements.define('analysis-clutchsize', AnalysisClutchSize)
