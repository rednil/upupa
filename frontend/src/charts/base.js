import { LitElement, html, css } from "lit"

export function parseValue([clutchSize, nestlings, nestlingsBanded, layingStart, breedingStart, hatchDate]){
	return {clutchSize, nestlings, nestlingsBanded, layingStart, breedingStart, hatchDate}
}
export function parseKey([state, year, species_id, occupancy]) {
	return { species_id, year, state, occupancy }
}
export const day2date = dayOfYear => {
	let date = new Date()
	date.setMonth(0)
	date.setDate(dayOfYear)
	return date
}
export class ChartBase extends LitElement {
	static get properties() {
		return {
			header: { type: String }
		}
	}
	static get styles() {
		return css`
			:host {
				display: flex;
				flex-direction: column;
				align-items: center;
			}
			.title {
				width: 100%;
				display: flex;
				justify-content: space-between;
			}
			
		`
	}
	constructor(){
		super()
		this.fetchData().then(() => this.requestUpdate())
	}
	willUpdate(){
		this.plot = this.getPlot()
	}
	render() {
		return html`
			<div>${this.header}</div>
			${this.plot}
		`
	}
}