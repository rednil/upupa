import { translate } from '../translator'
import '../forms/button-exportsvg'
import { getAllSummaries } from '../db/stats'
import { ChartBase, getSummaryProp } from './base'

export class ChartPropYear extends ChartBase {
	static get properties() {
		return {
			species_id: { type: String },
			type: { type: String }
		}
	}
	
	async fetchData(){
		this.summaries = await getAllSummaries()
	}
	willUpdate(){
		super.willUpdate()
		const currentSpecies = this.getSpeciesName()
		this.header = `${translate(this.type)}${currentSpecies ? ` ${currentSpecies}` : ''}, Änderung von Jahr zu Jahr`
	}
	getPlot(){
		if(!(this.summaries && this.type)) return ''
		const table = this.summaries
		.filter(({key, value}) => {
			return (
				(!this.species_id || (key.species_id == this.species_id)) &&
				key.occupancy == 1 &&
				getSummaryProp(this.type, value)
			)
		})
		.map(({key, value}) => {
			return {
				year: key.year,
				[translate(this.type)]: getSummaryProp(this.type, value)
			}
		})
		const x = {
			grid: true,
			inset: 6,
		}
		if(this.type == 'layingStart' || this.type == 'breedingStart' || this.type == 'hatchDate'){
			x.tickFormat = date => date.toLocaleString(undefined, {
				month: "numeric",
				day: "numeric"
			})
		}
		return Plot.plot({
			marginLeft: 50,
			marginRight: 50,
			x,
			y: {
				tickFormat: "d" 
			},
			marks: [
				Plot.boxX(table, {
					x: translate(this.type),
					y: "year",
				}),
				Plot.text(table, Plot.groupY(
					{x: "max"}, // Reducer: calculate the max 'x' value for each group
					{
						x: translate(this.type),
						y: "year",
						text: d => `n=${d.length}`, // Use the group's length for the text label
						dx: 10,           // Offset text to the right
						textAnchor: "start" // Align text to the l eft
					}
				))
			]
		})
	}
	
}

customElements.define('chart-prop-year', ChartPropYear)
