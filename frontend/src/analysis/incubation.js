import { html } from 'lit'
import '../charts/prop-species'
import '../charts/prop-year'
import { AnalysisBase } from './base'

export class AnalysisIncubation extends AnalysisBase {
		
	render() {
		return html`
			<chart-prop-species type="incubation" species_id=${this.species_id}></chart-prop-species>
			<chart-prop-year type="incubation" species_id=${this.species_id}></chart-prop-year>
		`
	}
	
}

customElements.define('analysis-incubation', AnalysisIncubation)
