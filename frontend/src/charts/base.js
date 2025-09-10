import { LitElement, html, css } from "lit"
import { mcp } from "../mcp"

export const day2date = dayOfYear => {
	let date = new Date()
	date.setMonth(0)
	date.setDate(dayOfYear)
	return date
}

export function getSummaryProp(type, value){
	const prop = value[type]
	switch(type){
		case 'layingStart':
		case 'breedingStart':
		case 'hatchDate': 
			return prop ? day2date(prop) : null
		case 'incubation':
			return (
				value.hatchDate && value.breedingStart 
				? value.hatchDate - value.breedingStart 
				: 0
			)
		default:
			return prop
	}
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
		this.__fetchData()
	}
	getSpeciesName(species_id = this.species_id){
		return this.species?.find(({_id}) => _id == species_id)?.name
	}
	async __fetchData(){
		this.species = await mcp.getByType('species')
		await this.fetchData()
		this.requestUpdate()
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