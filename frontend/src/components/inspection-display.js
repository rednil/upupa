import { LitElement, html, css } from 'lit'
import { translate } from '../translator.js'
export class InspectionDisplay extends LitElement {
	static get properties() {
		return {
			inspection: { type: Object },
			species: { type: Array }
		}
	}
	static get styles() {
		return css`
			:host {
				display: flex;
				flex-direction: column;
			}
			:host > * {
				display: flex;
				justify-content: space-between;
			}
			.head > * {
				flex: 1;
			}
			.head > *:nth-child(2){
				text-align: center;
			}
			.head > *:nth-child(3){
				text-align: right;
			}
			.date {
				font-weight: bold;
			}
		`
	}
	render() {
		const {date, note, eggs, nestlings, state, species_id} = this.inspection
		return html`
			<div class="head">
				<span class="date">${new Date(date).toLocaleDateString({}, {dateStyle: 'long'})}</span>
				<span>${this.getSpeciesName(species_id)}</span>
				<span>${translate(state)}</span>
			</div>
			<div><span>Anzahl Eier</span><span>${eggs}</span></div>
			<div><span>Anzahl Nestlinge</span><span>${nestlings}</span></div>
			<div>Bemerkung: ${note}</div>
			`
	}
	getSpeciesName(species_id){
		return this.species.find(species => species._id == species_id)?.name || '---'
	}
}

customElements.define('inspection-display', InspectionDisplay)
