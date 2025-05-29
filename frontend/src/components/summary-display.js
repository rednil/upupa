import { LitElement, html, css } from 'lit'
import { translate } from '../translator.js'

function getDateValue(date){
	return (date || '').split('T')[0]
}
function getShortDate(date){
	return new Date(date)
	.toLocaleDateString(undefined, {day: "numeric", month: "numeric"})
}
function getMediumDate(date){
	return new Date(date)
	.toLocaleDateString(undefined, {day: "numeric", month: "long"})
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
		return [
			this.renderHead(),
			summary.state != 'STATE_EMPTY' ? this.renderDetail() : '',
			summary.state == 'STATE_FAILURE' ? this.renderFailure() : ''
		]
	}
	renderHead(){
		const summary = this.summary
		return html`
			<div class="head">
				<span>${summary.occupancy}. Belegung</span>
				<span>${this.getSpeciesName(summary.species_id)}</span>
				<span>${translate(summary.state)}</span>
			</div>
		`
	}
	renderDetail(){
		const summary = this.summary
		return html`
			<div><span>Gelegegröße</span><span>${summary.clutchSize}</span></div>
			${summary.state=='STATE_SUCCESS'?html`
				<div><span>Nestlinge ausgeflogen</span><span>${summary.nestlings}</span></div>
			`:''}
			<div class="date"><label for="layingStart">Legebeginn</label><span id="layingStart">${getMediumDate(summary.layingStart)}</span></div>
			<div class="date"><label for="breedingStart">Brutbeginn</label><span id="breedingStart">${getMediumDate(summary.breedingStart)}</span></div>
			<div class="date"><label for="hatchDate">Schlüpfdatum</label><span id="hatchDate">${getMediumDate(summary.hatchDate)}</span></div>
			${summary.hatchDate ? html`
				<div><span>Beringungszeitfenster</span><span>${getMediumDate(summary.bandingWindowStart)}-${getMediumDate(summary.bandingWindowEnd)}</span></div>	
			`:''}
			<div>
				<span>Beringung</span>
				<span>
					<span>
						<input type="checkbox" .checked=${summary.maleBanded} disabled>
						<span>M</span>
					</span>
					<span>
						<input type="checkbox" .checked=${summary.femaleBanded} disabled>
						<span>W</span>
					</span>
					<span>
						<input type="checkbox" .checked=${summary.nestlingsBanded} disabled>
						<span>N</span>
						<span>${summary.nestlingsBanded}</span>
					</span>
				</span>
			</div>
		`
	}
	renderFailure(){
		const summary = this.summary
		return html`
			<div><span>Grund für Misserfolg</span><span>${translate(summary.reasonForLoss)}</span></div>
			${summary.reasonForLoss == 'PREDATION' ? html`
				<div><span>Prädator</span><span>${summary.predator}</span></div>
			`:''}
			${summary.reasonForLoss == 'NEST_OCCUPATION' ? html`
				<div><span>Okkupator</span><span>${this.getSpeciesName(summary.occupator_id)}</span></div>
			`:''}

		`
	}
	getSpeciesName(species_id){
		return this.species.find(species => species._id == species_id)?.name || '---'
	}
}

customElements.define('summary-display', SummaryDisplay)
