import { LitElement, html, css } from 'lit'
import { translate } from '../translator.js'
import { Proxy } from '../proxy.js'

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
		this.proxy = new Proxy(this)
		this.species = []
		this.perpetrators = []
		this.summary = {}
		this.fetchData()
	}
	async fetchData(){
		this.species = await this.proxy.getByType('species')
		this.perpetrators = await this.proxy.getByType('perpetrator')
	}
	render() {
		const summary = this.summary
		return [
			this.renderHead(),
			summary.state != 'STATE_EMPTY' ? this.renderDetail() : '',
			summary.state == 'STATE_FAILURE' ? this.renderFailure() : '',
			this.renderPerpetrator()
		]
	}
	renderHead(){
		const summary = this.summary
		return html`
			<div class="head">
				<span>${summary.occupancy}. Belegung</span>
				<span>${this.getName(this.species, summary.species_id)}</span>
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
				<span>${this.getName(this.perpetrators, perpetrator_id)}</span>
			</div>
		`
	}
	getName(items, id){
		return items.find(({_id}) => _id == id)?.name || '---'
	}
}

customElements.define('summary-display', SummaryDisplay)
