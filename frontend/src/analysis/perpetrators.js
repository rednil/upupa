import { html } from 'lit'
import '../charts/perpetrators-date.js'
import { AnalysisBase } from './base'

export class AnalysisPerpetrators extends AnalysisBase {
	static get properties() {
		return {
			perpetrator_id: { type: String }
		}
	}
	render() {
		return html`
			<chart-perpetrators-date perpetrator_id=${this.perpetrator_id}></chart-perpetrators-date>
		`
	}
}

customElements.define('analysis-perpetrators', AnalysisPerpetrators)
