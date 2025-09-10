import { LitElement, html, css } from 'lit'
import '../charts/prop-species'
import '../charts/prop-year'
import '../forms/button-exportsvg'
import { translate } from '../translator'
import { AnalysisBase } from './base'

export class AnalysisDate extends AnalysisBase {
	static get properties() {
		return {
			type: { type: String },
		}
	}
	
	render() {
		return html`
			<chart-prop-species 
				type=${this.type}
				species_id=${this.species_id}
			></chart-prop-species>
			<chart-prop-year
				type=${this.type}
				species_id=${this.species_id}
			></chart-prop-year>
		`
	}
}

customElements.define('analysis-date', AnalysisDate)
