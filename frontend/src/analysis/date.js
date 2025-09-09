import { LitElement, html, css } from 'lit'
import '../charts/date-species'
import '../charts/date-year'
import '../forms/button-exportsvg'
import { translate } from '../translator'

export class AnalysisDate extends LitElement {
	static get properties() {
		return {
			type: { type: String },
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
			this.renderChartDateSpecies(),
			this.renderChartDateYear()
		]
	}
	
	renderChartDateSpecies(){
		if(this.species_id) return ''
		return html`
			<chart-date-species 
				type=${this.type}
				header=${translate(`CHART_DATE_SPECIES_${this.type}`)}
			></chart-date-species>
		`
	}
	renderChartDateYear(){
		return html`
			<chart-date-year
				type=${this.type}
				species_id=${this.species_id}
				header=${translate(`CHART_DATE_YEAR_${this.type}`)}
			></chart-date-year>
		`
	}
}

customElements.define('analysis-date', AnalysisDate)
