import { mcp } from '../mcp'
import { getAllSummaries } from '../db/stats'
import { translate } from '../translator'
import '../forms/button-exportsvg'
import { ChartBase, day2date, getSummaryProp } from './base'



export class ChartPropSpecies extends ChartBase {
	static get properties() {
		return {
			type: { type: String },
			species_id: { type: String }
		}
	}
	willUpdate(){
		super.willUpdate()
		this.header = translate(this.type)
	}
	
	async fetchData(){
		this.summaries = await getAllSummaries()
	}
	
	getPlot(){
		const propName = translate(this.type)	
		if(!(this.summaries && this.type && this.species)) return ''
		const currentSpecies = this.getSpeciesName()
		const table = this.summaries
		.filter(({key, value}) => key.occupancy == 1 && getSummaryProp(this.type, value))
		.map(({key, value}) => {
			const {species_id} = key
			return {
				species: this.getSpeciesName(species_id),
				[propName]: getSummaryProp(this.type,value)
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
			marginLeft: 100,
			marginRight: 40,
			x,
			marks: [
				Plot.boxX(table, {
					x: propName,
					y: "species",
					sort: {y: "x", reduce: "mean"},
					fill: d => (d.species == currentSpecies) ? 'lightcoral' : '#ccc'
				}),
				Plot.text(table, Plot.groupY(
					{x: "max"}, // Reducer: calculate the max 'x' value for each group
					{
						x: propName,
						y: "species",
						text: d => `n=${d.length}`, // Use the group's length for the text label
						dx: 10,           // Offset text to the right
						textAnchor: "start" // Align text to the l eft
					}
				))
			]
		})
	}
	
	
}

customElements.define('chart-prop-species', ChartPropSpecies)
