import { html } from 'lit'
import '../charts/outcome'
import { AnalysisBase } from './base'

export class AnalysisFailure extends AnalysisBase {
	
	render() {
		return html`
			<chart-outcome species_id=${this.species_id} failure success></chart-outcome>
			<chart-outcome species_id=${this.species_id} failure success normalize></chart-outcome>
			<chart-outcome species_id=${this.species_id} failure normalize></chart-outcome>
		`
	}
}

customElements.define('analysis-failure', AnalysisFailure)
