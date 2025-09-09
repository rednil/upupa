import { html } from 'lit'
import '../charts/incubation-species'
import { AnalysisBase } from './base'

export class AnalysisIncubation extends AnalysisBase {
		
	render() {
		return [
			this.renderChartIncubationSpecies(),
			this.renderChartDateYear()
		]
	}
	renderChartIncubationSpecies(){
		if(this.species_id) return ''
		return html`
			<chart-incubation-species type=${this.type}></chart-incubation-species>
		`
	}
	renderChartDateYear(){
		return html`
			<chart-incubation-year type=${this.type} species_id=${this.species_id}></chart-incubation-year>
		`
	}
}

customElements.define('analysis-incubation', AnalysisIncubation)
