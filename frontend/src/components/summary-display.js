import { LitElement, html, css } from 'lit'
import { translate } from '../translator.js'
import './id-resolver.js'
import { getStateLabel } from './inspection-display.js'

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
const banding = val => {
	switch(val){
		case true: return 'Ja'
		case false: return 'Nein'
		default: return '?'
	}
}
export const bandingDisplay = inspection => `M: ${banding(inspection.maleBanded)} | F: ${banding(inspection.femaleBanded)} | N: ${inspection.nestlingsBanded || 0}`
export class SummaryDisplay extends LitElement {
	static get properties() {
		return {
			summary: { type: Object },
			species: { type: Array },
			perpetrators: { type: Array }
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
	constructor(){
		super()
		this.summary = {}
	}
	
	render() {
		const summary = this.summary
		return [
			this.renderHead(),
			this.renderDetail(),
			summary.state == 'STATE_FAILURE' ? this.renderFailure() : '',
			this.renderPerpetrator()
		]
	}
	renderHead(){
		const summary = this.summary
		return html`
			<div class="head">
				<span>${summary.occupancy}. Belegung</span>
				<id-resolver type="species" value=${summary.species_id}></id-resolver>
				<span>${getStateLabel(summary)}</span>
			</div>
		`
	}
	
	renderDetail(){
		const summary = this.summary
		return html`
			<div>
				<span>Gelegegröße</span>
				<span>${summary.clutchSize}</span>
			</div>
			${summary.state=='STATE_SUCCESS'?html`
				<div><span>Nestlinge ausgeflogen</span><span>${summary.nestlings}</span></div>
			`:''}
			${
				['layingStart', 'breedingStart', 'hatchDate'].map(key => summary[key] ? html`
					<div class="date">
						<label for=${key}>${translate(key)}</label>
						<span id=${key}>${getMediumDate(summary[key])}</span>
					</div>
				`:'')
			}
			${summary.hatchDate ? html`
				<div><span>Beringungszeitfenster</span><span>${getMediumDate(summary.bandingWindowStart)}-${getMediumDate(summary.bandingWindowEnd)}</span></div>	
			`:''}
			<div>
				<span>Beringung</span>
				<span>${bandingDisplay(summary)}</span>
			</div>
		`
	}
	
	renderFailure(){
		const summary = this.summary
		return html`
			<div>
				<span>Grund für Misserfolg</span>
				<span>${translate(summary.reasonForLoss)}</span>
			</div>
		`
	}
	renderPerpetrator(){
		const {perpetrator_id, reasonForLoss} = this.summary
		return !perpetrator_id ? '' : html`
			<div>
				<span>${translate(`${reasonForLoss}.PERPETRATOR`)}</span>
				<id-resolver type="perpetrator" value=${perpetrator_id}></id-resolver>
			</div>
		`
	}
	getName(items, id){
		return items.find(({_id}) => _id == id)?.name || '---'
	}
}

customElements.define('summary-display', SummaryDisplay)
