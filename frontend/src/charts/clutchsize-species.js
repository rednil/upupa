import { mcp } from '../mcp'
import { getAllSummaries } from '../db'
import { translate } from '../translator'
import '../forms/button-exportsvg'
import { ChartBase, day2date } from './base'



export class ChartClutchSizeSpecies extends ChartBase {
	static get properties() {
		return {
			
		}
	}
	
	
	async fetchData(){
		this.species = await mcp.getByType('species')
		this.summaries = await getAllSummaries()
	}
	

	
	
	getPlot(){
		if(!(this.summaries)) return ''
		const table = this.summaries
		.map(({key, value}) => {
			const {clutchSize} = value
			const {species_id} = key
			return {
				species: this.species.find(({_id}) => _id == species_id).name,
				clutchSize
			}
		})

		return Plot.plot({
			marginLeft: 100,
			marginRight: 40,
			x: {
				grid: true,
				inset: 6
			},
			
			marks: [
				Plot.boxX(table, {
					x: "clutchSize",
					y: "species",
					sort: {y: "x", reduce: "mean"}
				}),
				Plot.text(table, Plot.groupY(
					{x: "max"}, // Reducer: calculate the max 'x' value for each group
					{
						x: "clutchSize",
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

customElements.define('chart-clutchsize-species', ChartClutchSizeSpecies)
