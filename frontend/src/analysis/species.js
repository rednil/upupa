import { html } from 'lit'
import '../charts/species-relative'
import { AnalysisBase } from './base'

export class AnalysisSpecies extends AnalysisBase {
	
	render() {
		return html`
			<chart-species-relative species_id=${this.species_id}></chart-species-relative>
		`
	}
}

customElements.define('analysis-species', AnalysisSpecies)
