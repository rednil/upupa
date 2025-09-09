import { LitElement, html, css } from 'lit'
import '../charts/clutchsize-species'
import { translate } from '../translator'

export class AnalysisClutchSize extends LitElement {
	static get properties() {
		return {
			species_id: { type: String }
		}
	}
	
	render() {
		return [
			this.renderChartClutchSizeSpecies(),
			this.renderChartClutchSizeYear()
		]
	}
	renderChartClutchSizeSpecies(){
		if(this.species_id) return ''
		return html`
			<chart-clutchsize-species type=${this.type}></chart-clutchsize-species>
		`
	}
	renderChartClutchSizeYear(){
		return html`
			<chart-clutchsize-year type=${this.type} species_id=${this.species_id}></chart-clutchsize-year>
		`
	}
}

customElements.define('analysis-clutchsize', AnalysisClutchSize)
