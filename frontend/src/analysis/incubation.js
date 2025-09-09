import { LitElement, html, css } from 'lit'
import '../charts/incubation-species'
import { translate } from '../translator'

export class AnalysisIncubation extends LitElement {
	static get properties() {
		return {
			species_id: { type: String }
		}
	}
	static get styles() {
		return css`
      :host {
        display: flex;
				flex-direction: column;
        align-items: center;
			}
		`
	}
	
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
