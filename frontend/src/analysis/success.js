import { html } from 'lit'
import '../charts/survival-rate'
import { AnalysisBase } from './base'

export class AnalysisSuccess extends AnalysisBase {
	
	render() {
		return html`
			<chart-survival-rate species_id=${this.species_id} type="egg"></chart-survival-rate>
			<chart-survival-rate species_id=${this.species_id} type="clutch"></chart-survival-rate>
		`
	}
}

customElements.define('analysis-success', AnalysisSuccess)
