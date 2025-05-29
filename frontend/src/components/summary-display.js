import { LitElement, html, css } from 'lit'
import { translate } from '../translator.js'

function getDateValue(date){
	return (date || '').split('T')[0]
}
function getShortDate(date){
	return new Date(date).toLocaleDateString(undefined, {day: "numeric", month: "numeric"})
}

export class SummaryDisplay extends LitElement {
	static get properties() {
		return {
			summary: { type: Object },
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
			.head > *:nth-child(2){
				text-align: center;
			}
			.head > *:nth-child(3){
				text-align: right;
			}
			.head {
				font-weight: bold;
			}
			.head > * {
				flex: 1;
			}
		`
	}
	render() {
		const summary = this.summary

		return html`
			<div class="head">
				<span>${summary.occupancy}. Belegung</span>
				<span>${this.getSpeciesName(summary.species_id)}</span>
				<span>${translate(summary.state)}</span>
			</div>
			<div><span>Gelegegröße</span><span>${summary.clutchSize}</span></div>
			<div><span>Nestlinge ausgeflogen</span><span>${summary.offspring}</span></div>
			<div class="date"><label for="layingStart">Legebeginn</label><span id="layingStart">${getShortDate(summary.layingStart)}</span></div>
			<div class="date"><label for="breedingStart">Brutbeginn</label><span id="breedingStart">${getShortDate(summary.breedingStart)}</span></div>
			<div class="date"><label for="hatchDate">Schlüpfdatum</label><span id="hatchDate">${getShortDate(summary.hatchDate)}</span></div>
			${summary.hatchDate ? html`
				<div><span>Beringungszeitfenster</span><span>${getShortDate(summary.bandingWindowStart)}-${getShortDate(summary.bandingWindowEnd)}</span></div>	
			`:''}
			<div><span>Nestlinge beringt</span><span>${summary.nestlingsBanded}</span></div>
			<div><span>Weibchen beringt</span><span>${summary.femaleBanded ? 'ja' : 'nein'}</span></div>
			<div><span>Männchen beringt</span><span>${summary.maleBanded ? 'ja' : 'nein'}</span></div>
			${summary.state == 'STATE_FAILURE' ? html`
				<div><span>Grund für Misserfolg</span><span>${summary.reasonForLoss}</span></div>
				<div><span>Prädator</span><span>${summary.predator}</span></div>
			`:''}
		`
	}
	getSpeciesName(species_id){
		return this.species.find(species => species._id == species_id)?.name || '---'
	}
}

customElements.define('summary-display', SummaryDisplay)
