import { mcp } from '../mcp'
import { getAllSummaries } from '../db'
import { translate } from '../translator'
import '../forms/button-exportsvg'
import { ChartBase, day2date } from './base'



export class ChartDateSpecies extends ChartBase {
	static get properties() {
		return {
			type: { type: String }
		}
	}
	
	
	async fetchData(){
		this.species = await mcp.getByType('species')
		this.summaries = await getAllSummaries()
		
	}
	

	
	
	getPlot(){
		if(!(this.summaries && this.type && this.species)) return ''
		const table = this.summaries
		.filter(({key, value}) => key.occupancy == 1 && value[this.type] != 0 )
		.map(({key, value}) => {
			const dayOfTheYear = value[this.type]
			const {species_id} = key
			return {
				species: this.species.find(({_id}) => _id == species_id).name,
				date: day2date(dayOfTheYear)
			}
		})
		return Plot.plot({
			marginLeft: 100,
			marginRight: 40,
			x: {
				grid: true,
				inset: 6,
				tickFormat: date => date.toLocaleString(undefined, {
					month: "numeric",
					day: "numeric"
				})
			},
			
			marks: [
				Plot.boxX(table, {
					x: "date",
					y: "species",
					sort: {y: "x", reduce: "mean"}
				}),
				Plot.text(table, Plot.groupY(
					{x: "max"}, // Reducer: calculate the max 'x' value for each group
					{
						x: "date",
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

customElements.define('chart-date-species', ChartDateSpecies)
